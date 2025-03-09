import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function POST(request:Request) {
  await dbConnect()

  const session = await getServerSession(authOptions)
  const user: User = session?.user as User

  if(!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not authenticated"
      },
      { status: 401 }
    )
  }

  // Converts the user’s _id from a string to an ObjectId
  const userId = new mongoose.Types.ObjectId(user._id);
  try {
    const user = await UserModel.aggregate([
      { $match: {_id: userId}}, // Filters the collection to find the document where id matches userId
      {$unwind: '$messages'}, //Deconstructs the messages array
      {$sort: {'messages.createdAt': -1}},
      {$group: {_id: '$_id', messages: {$push: "$messages"}}} // Reconstructs the user document by grouping messages back into an array.
    ])

    if (!user || user.length === 0) {
      return Response.json(
        {
          success: false,
          message: "User not found"
        },
        { status: 401}
      )
    }

    return Response.json(
      {
        success: true,
        message: user[0].messages
      },
      { status: 200}
    )
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error"
      },
      { status: 500 }
    );
  }
}
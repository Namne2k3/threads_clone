"use server"

import { revalidatePath } from "next/cache"
import Thread from "../models/thread.model"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}


export async function createThread({
    text, author, communityId, path
}: Params) {
    try {
        await connectToDB()

        const newThread = await Thread.create({
            text,
            author,
            communityId: null,
        })

        // update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: newThread }
        })

        revalidatePath(path)
    } catch (error: any) {
        throw new Error(`Error creating thread: ${error.message}`)
    }
}
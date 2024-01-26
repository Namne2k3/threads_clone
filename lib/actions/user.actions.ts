'use server'
import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose"
import User from "../models/user.model";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

interface params {
    userId: string,
    username: string,
    name: string,
    bio: string,
    image: string,
    path: string
}

export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc"
}: {
    userId: string,
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}) {
    try {
        await connectToDB()

        const skipAmount = (pageNumber - 1) * pageSize

        const regex = new RegExp(searchString, "i")

        // $ne: not equal
        const query: FilterQuery<typeof User> = {
            id: { $ne: userId }
        }

        // The $or operator performs a logical OR operation 
        // on an array of one or more <expressions> 
        // and selects the documents that satisfy at least one of the <expressions>.
        if (searchString.trim() !== '') {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } }
            ]
        }

        const sortOptions = { createdAt: sortBy }

        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)

        const totalUsersCount = await User.countDocuments(query)

        const users = await usersQuery.exec()

        const isNext = totalUsersCount > skipAmount * users.length

        return {
            users, isNext
        }

    } catch (error: any) {
        throw new Error(`Failed to fetch Users: ${error.message}`)
    }
}

export async function fetchUserPosts(userId: string) {
    try {
        await connectToDB()
        // find all threads authored by user with the given userId

        // TODO: populate community
        const threads = await User.findOne({ id: userId }).populate({
            path: 'threads',
            model: Thread,
            populate: {
                path: 'children',
                model: Thread,
                populate: {
                    path: 'author',
                    model: User,
                    select: 'name image id'
                }
            }
        })

        return threads

    } catch (error: any) {
        throw new Error(`Failed to fetch User Posts: ${error.message}`)
    }
}

export async function fetchUser(userId: String) {
    try {
        await connectToDB()

        return await User
            .findOne({ id: userId })
        // .populate({
        //     path: 'communities',
        //     model: Community
        // })
    } catch (error: any) {
        throw new Error(`Failed to fetch User: ${error.message}`)
    }
}

export async function updateUser(
    {
        userId,
        username,
        name,
        bio,
        image,
        path
    }: params
): Promise<void> {
    await connectToDB();

    try {
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name,
                bio,
                image,
                onboarded: true
            },
            { upsert: true }
        )

        if (path === '/profile/edit') {
            revalidatePath(path)
        }
    } catch (error: any) {
        throw new Error(`Failed to create/update user: ${error.message}`)

    }
}
"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
// 1.47
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UserValidation } from '@/lib/validations/user';
import Image from "next/image"
import { ChangeEvent, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { isBase64Image } from "@/lib/utils"
import { useUploadThing } from '@/lib/useUploadThing'
import { updateUser } from "@/lib/actions/user.actions"
import { usePathname, useRouter } from "next/navigation"

interface Props {
    user: {
        id: string;
        objectId: string;
        username: string;
        name: string;
        bio: string;
        image: string;
    };
    btnTitle: string;
}

const AccountProfile = ({ user, btnTitle }: Props) => {

    const [files, setFiles] = useState<File[]>([])
    const { startUpload } = useUploadThing('media')

    const router = useRouter()
    const pathName = usePathname()

    // checked
    const form = useForm({
        resolver: zodResolver(UserValidation),
        defaultValues: {
            profile_photo: user?.image || "",
            name: user?.name || "",
            username: user?.username || "",
            bio: user?.bio || ""
        }
    });

    // hàm submit profile vào cơ sở dữ liệu khi thay đổi thông tin file
    const onSubmit = async (values: z.infer<typeof UserValidation>) => {

        // values là các trường dữ liệu form được khởi tạo ở trên 

        // và được truyền vào component Form của shadCnUI
        const blob = values.profile_photo

        // nếu file ảnh đã đươc chuyển đổi thành định dạng base64 tức là user đã thay đổi ảnh
        const hasImageChange = isBase64Image(blob)

        // Nếu file ảnh đã bị thay đổi
        if (hasImageChange) {
            const imgRes = await startUpload(files)

            if (imgRes && imgRes[0].fileUrl) {
                values.profile_photo = imgRes[0].fileUrl;
            }
        }

        const valuesDoc = {
            userId: user.id,
            username: values.username,
            name: values.name,
            bio: values.bio,
            image: values.profile_photo,
            path: pathName
        }

        // TODO: Update user profile
        await updateUser(valuesDoc)

        // 2:23:11

        if (pathName === '/profile/edit') {
            router.back()
        } else {
            router.push('/')
        }
        console.log(values)
    }

    // hàm xử lý khi thay đổi hình ành trong profile - Checked
    const handleImage = (e: ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void) => {
        e.preventDefault();

        // hàm FileReader của JS
        const fileReader = new FileReader();

        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // not accept files but image
            if (!file.type.includes('image')) return;

            setFiles(Array.from(e.target.files));

            fileReader.onload = async (event) => {

                // convert image file to base64 string
                const imageDataUrl = event.target?.result?.toString() || '';

                // hàm để thay đổi ảnh ( hàm của field.onChange )
                fieldChange(imageDataUrl);
            }

            //When the read operation is finished, 
            //the readyState becomes DONE, 
            //and the loadend is triggered. 
            //At that time, the result attribute contains 
            //the data as a data: URL representing the file's data as a base64 encoded string.
            fileReader.readAsDataURL(file)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col justify-start gap-10">
                <FormField
                    control={form.control}
                    name="profile_photo"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-4">
                            <FormLabel className="account-form_image-label">
                                {field.value ? // field.value === form.profile_photo
                                    (
                                        <Image
                                            src={field.value}
                                            alt="profile photo"
                                            width={96}
                                            height={96}
                                            priority
                                            className="rounded-full object-contain"
                                        />
                                    )
                                    :
                                    (
                                        <Image
                                            src="/assets/profile.svg"
                                            alt="profile photo"
                                            width={24}
                                            height={24}
                                            priority
                                            className="object-contain"
                                        />
                                    )

                                }
                            </FormLabel>
                            <FormControl className="flex-1 text-base-semibold text-gray-200">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    placeholder="Upload a photo"
                                    className="account-form_image-input"
                                    onChange={(e) => handleImage(e, field.onChange)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-3 w-full">
                            <FormLabel className="text-base-semibold text-light-2">
                                Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    className="account-form_input no-focus"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-3 w-full">
                            <FormLabel className="text-base-semibold text-light-2">
                                Username
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    className="account-form_input no-focus"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-3 w-full">
                            <FormLabel className="text-base-semibold text-light-2">
                                Bio
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={10}
                                    className="account-form_input no-focus"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="bg-primary-500">Submit</Button>
            </form>
        </Form>
    )
}

export default AccountProfile
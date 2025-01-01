'use client';
import React, {Suspense, useEffect, useRef, useState} from 'react';
import {GameRecords, User} from '@prisma/client';
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Container} from "@/components/container";
import {Button, Input} from "@/components/ui";
import {addRecordActions, editRecordActions, updateImage, uploadImage} from "@/app/actions";
import toast from "react-hot-toast";
import ImageAddBlobScreen from "@/components/image-add-blop-screen";
import {PutBlobResult} from "@vercel/blob";
import { del } from '@vercel/blob';
import {DeleteRecordDialog} from "@/components/delete-record-dialog";
import {ImageBlopDialog} from "@/components/image-blop-dialog";
import TimeInput from "@/components/time-input";

interface Props {
    user: User;
    gameRecords: any[];
    className?: string;
}

export const EditGameRecord: React.FC<Props> = ({ user, gameRecords, className}) => {

    const [formDataImage, setFormDataImage] = useState<FormData | null>(null);

    const [timeState, setTimeState] = useState('');
    const [linkVideo, setLinkVideo] = useState('');

    const idRef = useRef("");
    const categoryIdRef = useRef("");
    const productIdRef = useRef("");
    const productItemIdRef = useRef("");
    const checkButtonUpdateRef = useRef(0);



    const handleFormDataReady = (data: FormData) => {
        console.log("Получен объект FormData:", data);
        setFormDataImage(data)
    };

    const addRecordIMAGE = async (img : any) => {
        await updateImage(formDataImage as FormData).then(blop => {
            if ('error' in blop) {
                return toast.error(`Failed to upload image: ${blop.error}`, {icon: '❌',});
            }
            toast.error('Image edit 📝', {icon: '✅',});
            editRecord(blop, img);
        });
    }

    const editRecord = async (blop: PutBlobResult, img : any) => {
        try {
            await editRecordActions({
                id : idRef.current,
                userId: user.id,
                categoryId: categoryIdRef.current,
                productId: productIdRef.current,
                productItemId: productItemIdRef.current,
                timestate: timeState,
                img: blop.url,
                linkVideo: linkVideo,
            })

            await fetch('/api/blop/del/' + encodeURIComponent(img), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            toast.error('Record edit 📝', {
                icon: '✅',
            });

        } catch (error) {
            return toast.error('Error edit data', {
                icon: '❌',
            });
        }
    }

   // const [timeValue, setTimeValue] = useState('');

    const handleTimeChange = (newTime : string, id : number) => {
        setTimeState(newTime);
        checkButtonUpdateRef.current = id;
    };


    return (
        <Container className="w-[100%]">
            <Table>
                <TableCaption>Gamerecord.online</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[10%]">Category</TableHead>
                        <TableHead className="w-[10%]">Game</TableHead>
                        <TableHead className="w-[15%]">Time</TableHead>
                        <TableHead className="w-[7%]">Image</TableHead>
                        <TableHead className="w-[12%]">Link</TableHead>
                        <TableCell className="w-[7%] text-right">Delete</TableCell>
                    </TableRow>
                </TableHeader>


                <Suspense>
                    {
                        gameRecords.map((records, index) => (

                            <TableBody key={index}>
                                <TableRow>

                                    <TableCell className="font-medium">
                                        <div>{records.user.fullName}</div>
                                        <div>{records.category.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{records.product.name}</div>
                                        <div>{records.productItem.name}</div>
                                    </TableCell>

                                    <TableCell>
                                        <div>{records.timestate}</div>
                                        <div>{timeState}</div>
                                        <TimeInput onTimeChange={handleTimeChange} id={records.id}/>
                                    </TableCell>

                                    <TableCell>
                                        <div>
                                            <input
                                                type="file"
                                                id="image"
                                                name="image"
                                                accept=".jpg, .jpeg, .png, image/*"
                                                required
                                                onChange={(e)=>{
                                                    if (e.target.files && e.target.files[0]) {
                                                        if (e.target.files[0].size > 2 * 1000 * 1024) {
                                                            return toast.error('Error create, Image > 2MB', {
                                                                icon: '❌',
                                                            });
                                                        }else {
                                                            const data  = new FormData();
                                                            data.append('image', e.target.files[0], e.target.files[0].name)
                                                            setFormDataImage(data)
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <ImageAddBlobScreen onFormDataReady={handleFormDataReady}/>
                                        </div>

                                    </TableCell>

                                    <TableCell>
                                        <Input
                                            type='text'
                                            placeholder="VIDEO YOUTUBE"
                                            onChange={e => {
                                                if(e.target.value.includes("watch?v=")){
                                                    setLinkVideo(e.target.value)
                                                }else{
                                                    setLinkVideo("")
                                                }
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div>
                                            <Button className="w-[60px] h-[20px] mb-1"
                                                    disabled={!formDataImage || checkButtonUpdateRef.current !== records.id}
                                                    onClick={()=>{
                                                        idRef.current = records.id;
                                                        categoryIdRef.current = records.categoryId;
                                                        productIdRef.current = records.productId;
                                                        productItemIdRef.current = records.productItemId;
                                                        addRecordIMAGE(records.img).then(()=>toast.error('Record edit 📝', {icon: '✅'}));
                                                    }}
                                            >Update</Button>
                                        </div>
                                        <div>
                                            <DeleteRecordDialog id={records.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>

                        ))}
                </Suspense>
            </Table>
        </Container>
    );
};

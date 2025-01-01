'use client';
import React, {useEffect, useState} from 'react';
import {Category, Product, ProductItem, User} from '@prisma/client';
import toast from 'react-hot-toast';
import {Container} from './container';
import {Title} from './title';
import {Button, Input} from '@/components/ui';
import {addRecordActions, uploadImage} from '@/app/actions';
import {PutBlobResult} from '@vercel/blob';
import ImageAddBlobScreen from "@/components/image-add-blop-screen";
import imageCompression from "browser-image-compression";


interface Props {
    user: User;
    category: Category[];
    product: Product[];
    productItem: ProductItem[];
    gameRecords: any[];
}

export const AddRecord: React.FC<Props> = ({user, category, product, productItem, gameRecords}) => {

    const [formData, setFormData] = useState<FormData | null>(null); // State для хранения FormData

    // Callback для получения FormData из ImageAddBlobScreen
    const handleFormDataReady = (data: FormData) => {
        console.log("Получен объект FormData:", data);
        //addRecordIMAGE(data).then(()=>imgRef.current = false)
        imgRef.current = true;
        setFormData(data); // Сохраняем FormData
    };

    const [categoryNameState, setCategoryNameState] = React.useState('');
    const [productNameState, setProductNameState] = React.useState('');
    const [productItemNameState, setProductItemNameState] = React.useState('');
    const [timestatState, setTimestatState] = React.useState('');
    const [videoState, setVideoState] = React.useState('');
    const [productFindState, setProductFindState] = React.useState<Product[]>([]);
    const [productItemState, setProductItemState] = React.useState<ProductItem[]>([]);

    const categoryIdRef = React.useRef(0);
    const productIdRef = React.useRef(0);
    const productItemIdRef = React.useRef(0);
    const addRecordViewRef = React.useRef(false);
    const imgRef = React.useRef(true);
    const videSetRef = React.useRef(true);

    const productFind = (item : any) => {
        categoryIdRef.current = item.id;
        productIdRef.current = 0;
        let array = []
        for (let i = 0; i < product.length; i++) {
            if (product[i].categoryId === item.id) {
                array.push(product[i]);
            }
        }
        setProductFindState(array);
        setCategoryNameState(item.name);
        addRecordViewRef.current = false;
    }

    const productItemFind = (item : any) => {
        productIdRef.current = item.id;
        //console.log(productIdRef.current);
        let array = []
        for (let i = 0; i < productItem.length; i++) {
            if (productItem[i].productId === item.id) {
                array.push(productItem[i]);
            }
        }
        setProductItemState(array);
        setProductNameState(item.name);
        addRecordViewRef.current = false;
    }

    const selectFile = async (e: any) => {
        if (e.target.files[0]) {
            if (e.target.files[0].size > 2 * 1000 * 1024) {
                const options = {
                    maxSizeMB: 1, // Максимальный размер в мегабайтах
                    maxWidthOrHeight: 1280, // Максимальная ширина или высота
                    useWebWorker: true, // Использовать веб-воркеры для повышения производительности
                };
                const compressedFile = await imageCompression(e.target.files[0], options);
                const data = new FormData();
                data.append('image', compressedFile, e.target.files[0].name)
                setFormData(data)
                imgRef.current = true;

            } else {
                //setFile(e.target.files[0])
                const data = new FormData();
                data.append('image', e.target.files[0], e.target.files[0].name)
                setFormData(data)
                imgRef.current = true;
            }
        }
    }

    const addRecordIMAGE = async () => {
        await uploadImage(formData as FormData).then(blop => {
            if ('error' in blop) {
                return toast.error(`Failed to upload image: ${blop.error}`, {icon: '❌',});
            }
            toast.error('Image create 📝', {icon: '✅',});
            addRecordFB(blop);
        });
    }

    const addRecordFB = async (blop: PutBlobResult ) => {
        try {
            await addRecordActions({
                userId: user.id,
                categoryId: categoryIdRef.current,
                productId: productIdRef.current,
                productItemId: productItemIdRef.current,
                timestate: timestatState,
                video: videoState,
                img: blop.url,
            });
            imgRef.current = true;
            toast.error('Record create 📝', {
                icon: '✅',
            });

        } catch (error) {
            return toast.error('Error create data', {
                icon: '❌',
            });
        }
    }


    return (
        <Container className="mt-4">

            {/*<Title text={`#${data.role}`} size="md" className="font-bold"/>*/}

            {/*CATEGORY_LIST*/}
            <div className="flex">
                <div className="flex-1 w-[20%]">
                    <Title text={`Category List`} size="md" className="font-bold"/>
                    {category.map((item) => (
                        <div key={item.id} className="flex w-full max-w-sm items-center space-x-2 mb-1">
                            <Button onClick={() => productFind(item)}>{item.name}</Button>
                        </div>
                    ))}
                </div>

                {/*PRODUCT_LIST*/}
                <div className="flex-1 w-[20%]">
                    <Title text={`${categoryNameState}`} size="md" className="font-bold"/>
                    <Title text={`Game List`} size="xs"/>
                    {categoryIdRef.current !== 0 && productFindState.map((item, index) => (
                        <div key={index} className="flex w-full max-w-sm items-center space-x-2 mb-1">
                            {/*<p>{item.id}</p>*/}
                            <Button
                                onClick={e => productItemFind(productFindState[index])}
                            >{item.name}</Button>
                        </div>
                    ))}
                </div>

                {/*PRODUCT_ITEM*/}
                <div className="flex-1 w-[30%]">
                    <Title text={`${productNameState}`} size="md" className="font-bold"/>
                    <Title text={`Road List`} size="xs"/>
                    {productIdRef.current !== 0 && productItemState.map((item, index) => (
                        <div key={index} className="flex w-full max-w-sm items-center space-x-2 mb-1">
                                {/*<p>{item.id}</p>*/}
                                <Button
                                    onClick={() => {
                                        productItemIdRef.current = productItemState[index].id;
                                        addRecordViewRef.current = true;
                                        setProductItemNameState(productItemState[index].name);
                                    }}
                                >{item.name}</Button>
                        </div>
                    ))}
                </div>

                {/*GAME_RECORD_CREATE*/}
                <div className="flex-1 w-[25%] ml-5">
                    <Title text={`${categoryNameState}`} size="md" className="font-bold"/>
                    <Title text={`${productNameState}`} size="md" className="font-bold"/>
                    <Title text={`${productItemNameState}`} size="md" className="font-bold"/>
                    {(productItemIdRef.current !== 0 && addRecordViewRef.current === true) &&
                        <div>
                            <label htmlFor="image">{"Image < 2Mb"}</label>
                            <Input
                                type="file"
                                id="image"
                                name="image"
                                accept=".jpg, .jpeg, .png, image/*"
                                required
                                onChange={selectFile}
                            />

                            <ImageAddBlobScreen onFormDataReady={handleFormDataReady} />

                            <div className="m-2">
                                <Input
                                    name="timestate"
                                    type="time"
                                    step="0.001"
                                    // pattern="[0-2]{1}[0-9]{1}:[0-5]{1}[0-9]{1}"
                                    defaultValue="00:00:00.000"
                                    onChange={e => {
                                        setTimestatState(e.target.value)
                                    }}
                                />
                            </div>

                            <div className="m-2">
                                <Input type='text'
                                       placeholder="VIDEO YOUTUBE"
                                       onChange={e => {
                                           if(e.target.value.includes("watch?v=")){
                                               setVideoState(e.target.value)
                                               videSetRef.current = false
                                           }else{
                                               videSetRef.current = true
                                               setVideoState("")
                                           }
                                       }}
                                />
                            </div>

                            {formData && (
                            <Button type="submit"
                                    disabled={timestatState === "" || imgRef.current === false  }
                                    onClick={() => {
                                        if (videSetRef.current) {
                                            addRecordIMAGE().then(()=>  toast.error('Error create Link video', {icon: '❌',}));
                                        } else {
                                            addRecordIMAGE().then(()=>  toast.error('Create Link video', {icon: '✅',}));
                                        }
                                    }}
                            >Upload</Button>
                            )}
                        </div>
                    }
                </div>
            </div>
        </Container>
    );
};

```tsx
<form onSubmit={async (e) => {
    if (e.target[0].files && e.target[0].files[0].size) {
        if (e.target[0].files[0].size > 1 * 1000 * 1024) {
            console.log("eeeeeeeeeeeeeeeeeeee ")
            return toast.error('Error create, Image > 2MB', {
                icon: '❌',
            });
        }
    }else {
        try {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await uploadImage(formData as FormData).then(blop => {
                toast.error('Image create 📝', {icon: '✅',});
                addRecordFB(blop);
            });
        } catch (e) {
            return toast.error('Error create, Image > 2MB', {
                icon: '❌',
            });
        }
    }

}}>

    <input
        type="file"
        id="image"
        name="image"
        accept=".jpg, .jpeg, .png, image/*"
        required/>
    <Button type="submit"
            disabled={timestatState === "" || videoState === ""}
            onClick={addRecordIMAGE}
    >Upload</Button>
</form>
```
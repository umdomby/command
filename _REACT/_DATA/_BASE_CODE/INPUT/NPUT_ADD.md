```tsx
<Container className="mt-4">
    <div className="flex">
        <div className="w-[30%]">
        </div>

        <div className="flex-1 w-[35%]">
            <Title text={`Product Edit`} size="md" className="font-bold"/>
        </div>

        <div className="flex-1 w-[35%]">
            <Title text={`Product Add`} size="md" className="font-bold"/>
            <div className="flex w-full max-w-sm items-center space-x-2 mb-1">
                <Input type='text'
                       value={productAddState}
                           onChange={e => {
                               setProductAddState(e.target.value)
                           }
                       }/>
                <Button
                    type="submit"
                    // onClick={eventSubmitCreate}
                >Add</Button>
            </div>
        </div>

    </div>
</Container>
```
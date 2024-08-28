```js
<Button variant="outline-success" onClick={()=> editDevice(dev.id)}>Edit</Button>
<Button variant="outline-danger" onClick={editDevice}>Del</Button>
```

```js
<Row>
 <Col style={{cursor: 'pointer'}}>  
     <Image width={50} height={20} src={process.env.REACT_APP_API_URL + device.img} 
            onClick={()=> {onHide(); setShowModal(true)}}/></Col>
</Row>
```
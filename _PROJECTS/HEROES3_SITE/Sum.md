{parseFloat(detail.price.replace(',', '.')).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 10 })}

{order.orderP2PPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 10 })}

{Number((order.orderP2PPoints * parseFloat(price.replace(',', '.'))).toFixed(10))}
const map = (x, in_min, in_max,out_min, out_max)=> {  
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;  
}  
refRjHoriz.current = map(rjHoriz, 0, 1, 90, 180);  
refRjVert.current = map(rjVert, 0, 1, 90, 180);  

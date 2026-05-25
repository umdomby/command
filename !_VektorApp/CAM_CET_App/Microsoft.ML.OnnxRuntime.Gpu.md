"C:\_GIT\onnxruntime\csharp\src\Microsoft.ML.OnnxRuntime\bin\Release\net8.0\Microsoft.ML.OnnxRuntime.dll"
"C:\_GIT\onnxruntime\build\Windows\Release\Release\onnxruntime.dll"
"C:\_GIT\onnxruntime\build\Windows\Release\Release\onnxruntime_providers_cuda.dll"
"C:\_GIT\onnxruntime\build\Windows\Release\Release\onnxruntime_providers_shared.dll"

C:\Program Files\NVIDIA\CUDNN\v9.20\lib\13.2\x64
C:\Program Files\NVIDIA\CUDNN\v9.20\bin\13.2\x64
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2\lib\x64
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2\bin\x64


Из папки CUDA v13.2 (...\bin):

cudart64_13.dll
cublas64_13.dll
cublasLt64_13.dll
cufft64_11.dll
curand64_10.dll
cusolver64_13.dll
cusparse64_13.dll

Из папки cuDNN v9.2 (...\bin\13.2\x64):

cudnn64_9.dll
cudnn_ops64_9.dll
cudnn_cnn64_9.dll
cudnn_adv64_9.dll

cudnn_engines_runtime_compiled64_9.dll

4. Проверка переменных окружения (PATH)
   Чтобы не копировать всё вручную, убедитесь, что пути, которые вы скинули, прописаны в системной переменной PATH.
   Особенно:
   C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2\bin
   C:\Program Files\NVIDIA\CUDNN\v9.20\bin\13.2\x64

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Structure;
using System.Drawing;

namespace picoCam_303C
{
    public class YoloInference : IDisposable
    {
        private InferenceSession? _session;
        private string[] _labels = Array.Empty<string>();
        private int _inputSize = 224;
        private string _inputName = "images"; // наиболее частое имя у YOLO

        public string ProviderStatus { get; private set; } = "Initializing...";
        public string[] Labels => _labels;

        public YoloInference(string modelPath, string modelRootPath, int requestedInputSize = 0)
        {
            if (!File.Exists(modelPath))
                throw new FileNotFoundException("Модель не найдена", modelPath);

            // Определяем размер входа модели
            _inputSize = GetInputSizeFromModel(modelPath);

            if (requestedInputSize > 0 && requestedInputSize != _inputSize)
            {
                Console.WriteLine($"[Warning] Requested input size {requestedInputSize}, model uses {_inputSize}");
            }

            // Загрузка классов
            LoadLabels(modelRootPath);

            // Создание сессии
            var options = new SessionOptions();
            try
            {
                options.AppendExecutionProvider_CUDA(0);
                ProviderStatus = "GPU (CUDA)";
            }
            catch
            {
                ProviderStatus = "CPU (Fallback)";
            }

            _session = new InferenceSession(modelPath, options);

            // Определяем реальное имя входного тензора
            if (_session.InputNames.Count > 0)
            {
                _inputName = _session.InputNames[0];
                Console.WriteLine($"[INFO] Input name: {_inputName}");
            }
            else
            {
                Console.WriteLine("[WARNING] InputNames is empty! Using default 'images'");
            }

            Console.WriteLine($"\n>>> AI Model: {ProviderStatus} | InputSize: {_inputSize} | Classes: {string.Join(", ", _labels)} | Input: {_inputName} <<<\n");
        }

        private void LoadLabels(string modelRootPath)
        {
            string dataYamlPath = Path.Combine(modelRootPath, "data.yaml");
            string argsYamlPath = Path.Combine(modelRootPath, "train", "args.yaml");

            if (File.Exists(dataYamlPath))
                _labels = LoadClassesFromDataYaml(dataYamlPath);
            else if (File.Exists(argsYamlPath))
                _labels = LoadClassesFromDataYaml(argsYamlPath);
            else
            {
                string trainDir = Path.Combine(modelRootPath, "train");
                var excluded = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "weights", "runs", ".git", "__pycache__" };

                _labels = Directory.Exists(trainDir)
                    ? Directory.GetDirectories(trainDir)
                        .Where(dir => !excluded.Contains(Path.GetFileName(dir)))
                        .Select(Path.GetFileName)
                        .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                        .ToArray()
                    : new string[] { "anomaly", "normal" };
            }
        }

        private string[] LoadClassesFromDataYaml(string yamlPath)
        {
            var lines = File.ReadAllLines(yamlPath);
            bool inNamesSection = false;
            var classes = new List<string>();

            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("names:"))
                {
                    inNamesSection = true;
                    continue;
                }
                if (inNamesSection)
                {
                    if (trimmed.StartsWith("- "))
                        classes.Add(trimmed.Substring(2).Trim());
                    else if (!string.IsNullOrWhiteSpace(trimmed) && !trimmed.StartsWith("#"))
                        inNamesSection = false;
                }
            }
            return classes.Count > 0 ? classes.ToArray() : new string[] { "anomaly", "normal" };
        }

        private int GetInputSizeFromModel(string modelPath)
        {
            try
            {
                using var tempSession = new InferenceSession(modelPath);
                var inputMeta = tempSession.InputMetadata.FirstOrDefault().Value;
                if (inputMeta?.Dimensions?.Length >= 4)
                {
                    int height = inputMeta.Dimensions[2];
                    int width = inputMeta.Dimensions[3];
                    if (height > 0 && width > 0 && height == width)
                        return height;
                }
            }
            catch { }
            return 224;
        }

        public (string Label, float Confidence) Predict(Mat frame)
        {
            if (frame == null || frame.IsEmpty || _session == null)
                return ("EMPTY", 0f);

            try
            {
                using Mat resized = new Mat();
                CvInvoke.Resize(frame, resized, new Size(_inputSize, _inputSize));
                CvInvoke.CvtColor(resized, resized, ColorConversion.Bgr2Rgb);

                var inputTensor = new DenseTensor<float>(new[] { 1, 3, _inputSize, _inputSize });

                using (Image<Rgb, float> imgData = resized.ToImage<Rgb, float>())
                {
                    float[,,] data = imgData.Data;
                    for (int y = 0; y < _inputSize; y++)
                        for (int x = 0; x < _inputSize; x++)
                        {
                            inputTensor[0, 0, y, x] = data[y, x, 0] / 255f;
                            inputTensor[0, 1, y, x] = data[y, x, 1] / 255f;
                            inputTensor[0, 2, y, x] = data[y, x, 2] / 255f;
                        }
                }

                var inputs = new List<NamedOnnxValue>
                {
                    NamedOnnxValue.CreateFromTensor(_inputName, inputTensor)
                };

                using var results = _session.Run(inputs);
                var output = results.First().AsEnumerable<float>().ToArray();

                // Поиск максимальной вероятности
                int maxIdx = 0;
                float maxConf = output[0];

                for (int i = 1; i < output.Length; i++)
                {
                    if (output[i] > maxConf)
                    {
                        maxConf = output[i];
                        maxIdx = i;
                    }
                }

                string label = (maxIdx < _labels.Length) ? _labels[maxIdx] : $"Unknown_{maxIdx}";
                return (label, maxConf);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Predict Error: {ex.Message}");
                return ("ERR", 0f);
            }
        }

        public (string Label, float Confidence) Predict(Mat frame, Rectangle roi)
        {
            if (frame == null || frame.IsEmpty)
                return ("EMPTY", 0f);

            using Mat roiImage = new Mat(frame, roi);
            return Predict(roiImage);
        }

        public void Dispose()
        {
            _session?.Dispose();
            _session = null;
        }
    }
}
Intel RealSense (D400-серия, особенно D435 / D435i / D455) — именно то, что используют в роботах
Это активная стереоскопическая RGB-D камера (active stereo + иногда IR projector для текстуры):

Stereo depth — две ИК-камеры + проектор случайной точки (dot pattern) для помощи в бес текстурных поверхностях.
RGB — отдельный цветной сенсор (обычно 1920×1080 или выше).
Глубина: до 1280×720 (или 848×480), миллионы точек на кадр.
Диапазон: 0.2–10 м (D455 до ~6–10 м с высокой точностью).
FoV: широкий — до 87°×58° (D435/D455), идеально для обзора стола/бин с деталями.
Глобальный затвор (global shutter) на глубине → нет distortion при быстром движении манипулятора.
Встроенный IMU (в моделях с "i") — помогает с motion compensation и SLAM.
Высокая частота: 30–90 fps.
Открытый SDK (librealsense), полная интеграция с ROS/ROS2, Python/C++/etc.
Промышленная надёжность: USB 3.0, металлический корпус, работает в разных условиях (включая outdoor с фильтрами).
Применение: именно для pick-and-place, bin-picking, grasping (RightHand Robotics, ABB, Fanuc и т.д. используют RealSense).

Аналоги (если не RealSense):

Orbbec Astra / Gemini (дешевле, похожи на RealSense, часто с global shutter).
Stereolabs ZED 2 / ZED X (пассивная стерео, очень широкий FoV, outdoor-friendly).
Luxonis OAK-D (с AI на борту, дешево и мощно для edge).
Azure Kinect (если нужен очень большой диапазон, но уже устарел).
В 2025–2026 годах популярны также новые Orbbec Gemini 345Lg (rugged, outdoor) и интегрированные с NVIDIA Jetson.


Intel RealSense D435i / D455
OAK-D Pro
PGDMP  1                     |            online_game    16.3    16.3 N               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    17866    online_game    DATABASE        CREATE DATABASE online_game WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE online_game;
                postgres    false            �            1259    17919    basket_devices    TABLE     �   CREATE TABLE public.basket_devices (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "basketId" integer,
    "deviceId" integer
);
 "   DROP TABLE public.basket_devices;
       public         heap    postgres    false            �            1259    17918    basket_devices_id_seq    SEQUENCE     �   CREATE SEQUENCE public.basket_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.basket_devices_id_seq;
       public          postgres    false    226                       0    0    basket_devices_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.basket_devices_id_seq OWNED BY public.basket_devices.id;
          public          postgres    false    225            �            1259    17907    baskets    TABLE     �   CREATE TABLE public.baskets (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" integer
);
    DROP TABLE public.baskets;
       public         heap    postgres    false            �            1259    17906    baskets_id_seq    SEQUENCE     �   CREATE SEQUENCE public.baskets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.baskets_id_seq;
       public          postgres    false    224                       0    0    baskets_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.baskets_id_seq OWNED BY public.baskets.id;
          public          postgres    false    223            �            1259    17898    brands    TABLE     �   CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
    DROP TABLE public.brands;
       public         heap    postgres    false            �            1259    17897    brands_id_seq    SEQUENCE     �   CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.brands_id_seq;
       public          postgres    false    222                       0    0    brands_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;
          public          postgres    false    221            �            1259    17953    device_infos    TABLE       CREATE TABLE public.device_infos (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deviceId" integer
);
     DROP TABLE public.device_infos;
       public         heap    postgres    false            �            1259    17952    device_infos_id_seq    SEQUENCE     �   CREATE SEQUENCE public.device_infos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.device_infos_id_seq;
       public          postgres    false    230                       0    0    device_infos_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.device_infos_id_seq OWNED BY public.device_infos.id;
          public          postgres    false    229            �            1259    17880    devices    TABLE     �  CREATE TABLE public.devices (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    img character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    username character varying(255) DEFAULT USER,
    timestate character varying(255) DEFAULT '01:02:03.400'::character varying,
    linkvideo character varying(255)
);
    DROP TABLE public.devices;
       public         heap    postgres    false            �            1259    17879    devices_id_seq    SEQUENCE     �   CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.devices_id_seq;
       public          postgres    false    218                       0    0    devices_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;
          public          postgres    false    217            �            1259    17936    ratings    TABLE     �   CREATE TABLE public.ratings (
    id integer NOT NULL,
    rate integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" integer,
    "deviceId" integer
);
    DROP TABLE public.ratings;
       public         heap    postgres    false            �            1259    17935    ratings_id_seq    SEQUENCE     �   CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.ratings_id_seq;
       public          postgres    false    228                       0    0    ratings_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;
          public          postgres    false    227            �            1259    17967    type_brands    TABLE     �   CREATE TABLE public.type_brands (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "typeId" integer,
    "brandId" integer
);
    DROP TABLE public.type_brands;
       public         heap    postgres    false            �            1259    17966    type_brands_id_seq    SEQUENCE     �   CREATE SEQUENCE public.type_brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.type_brands_id_seq;
       public          postgres    false    232                       0    0    type_brands_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.type_brands_id_seq OWNED BY public.type_brands.id;
          public          postgres    false    231            �            1259    17889    types    TABLE     �   CREATE TABLE public.types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
    DROP TABLE public.types;
       public         heap    postgres    false            �            1259    17888    types_id_seq    SEQUENCE     �   CREATE SEQUENCE public.types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.types_id_seq;
       public          postgres    false    220                       0    0    types_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.types_id_seq OWNED BY public.types.id;
          public          postgres    false    219            �            1259    17868    users    TABLE     f  CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255),
    password character varying(255),
    role character varying(255) DEFAULT 'USER'::character varying,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    point integer DEFAULT 1000,
    ip character varying(255)
);
    DROP TABLE public.users;
       public         heap    postgres    false            �            1259    17867    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public          postgres    false    216                       0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public          postgres    false    215            K           2604    17922    basket_devices id    DEFAULT     v   ALTER TABLE ONLY public.basket_devices ALTER COLUMN id SET DEFAULT nextval('public.basket_devices_id_seq'::regclass);
 @   ALTER TABLE public.basket_devices ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    225    226    226            J           2604    17910 
   baskets id    DEFAULT     h   ALTER TABLE ONLY public.baskets ALTER COLUMN id SET DEFAULT nextval('public.baskets_id_seq'::regclass);
 9   ALTER TABLE public.baskets ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    224    223    224            I           2604    17901 	   brands id    DEFAULT     f   ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);
 8   ALTER TABLE public.brands ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    221    222    222            M           2604    17956    device_infos id    DEFAULT     r   ALTER TABLE ONLY public.device_infos ALTER COLUMN id SET DEFAULT nextval('public.device_infos_id_seq'::regclass);
 >   ALTER TABLE public.device_infos ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    229    230    230            E           2604    17883 
   devices id    DEFAULT     h   ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);
 9   ALTER TABLE public.devices ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    217    218    218            L           2604    17939 
   ratings id    DEFAULT     h   ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);
 9   ALTER TABLE public.ratings ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    228    227    228            N           2604    17970    type_brands id    DEFAULT     p   ALTER TABLE ONLY public.type_brands ALTER COLUMN id SET DEFAULT nextval('public.type_brands_id_seq'::regclass);
 =   ALTER TABLE public.type_brands ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    231    232    232            H           2604    17892    types id    DEFAULT     d   ALTER TABLE ONLY public.types ALTER COLUMN id SET DEFAULT nextval('public.types_id_seq'::regclass);
 7   ALTER TABLE public.types ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    220    219    220            B           2604    17871    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    215    216    216            	          0    17919    basket_devices 
   TABLE DATA           ^   COPY public.basket_devices (id, "createdAt", "updatedAt", "basketId", "deviceId") FROM stdin;
    public          postgres    false    226   e\                 0    17907    baskets 
   TABLE DATA           I   COPY public.baskets (id, "createdAt", "updatedAt", "userId") FROM stdin;
    public          postgres    false    224   �\                 0    17898    brands 
   TABLE DATA           Q   COPY public.brands (id, name, description, "createdAt", "updatedAt") FROM stdin;
    public          postgres    false    222   �\                 0    17953    device_infos 
   TABLE DATA           d   COPY public.device_infos (id, title, description, "createdAt", "updatedAt", "deviceId") FROM stdin;
    public          postgres    false    230   �]                 0    17880    devices 
   TABLE DATA           w   COPY public.devices (id, name, description, img, "createdAt", "updatedAt", username, timestate, linkvideo) FROM stdin;
    public          postgres    false    218   ^                 0    17936    ratings 
   TABLE DATA           [   COPY public.ratings (id, rate, "createdAt", "updatedAt", "userId", "deviceId") FROM stdin;
    public          postgres    false    228   !c                 0    17967    type_brands 
   TABLE DATA           X   COPY public.type_brands (id, "createdAt", "updatedAt", "typeId", "brandId") FROM stdin;
    public          postgres    false    232   >c                 0    17889    types 
   TABLE DATA           C   COPY public.types (id, name, "createdAt", "updatedAt") FROM stdin;
    public          postgres    false    220   [c       �          0    17868    users 
   TABLE DATA           _   COPY public.users (id, email, password, role, "createdAt", "updatedAt", point, ip) FROM stdin;
    public          postgres    false    216   �c                  0    0    basket_devices_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.basket_devices_id_seq', 1, false);
          public          postgres    false    225                        0    0    baskets_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.baskets_id_seq', 1, false);
          public          postgres    false    223            !           0    0    brands_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.brands_id_seq', 20, true);
          public          postgres    false    221            "           0    0    device_infos_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.device_infos_id_seq', 1, false);
          public          postgres    false    229            #           0    0    devices_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.devices_id_seq', 28, true);
          public          postgres    false    217            $           0    0    ratings_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.ratings_id_seq', 1, false);
          public          postgres    false    227            %           0    0    type_brands_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.type_brands_id_seq', 1, false);
          public          postgres    false    231            &           0    0    types_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.types_id_seq', 8, true);
          public          postgres    false    219            '           0    0    users_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.users_id_seq', 5, true);
          public          postgres    false    215            ^           2606    17924 "   basket_devices basket_devices_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.basket_devices
    ADD CONSTRAINT basket_devices_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.basket_devices DROP CONSTRAINT basket_devices_pkey;
       public            postgres    false    226            \           2606    17912    baskets baskets_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT baskets_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.baskets DROP CONSTRAINT baskets_pkey;
       public            postgres    false    224            Z           2606    17905    brands brands_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.brands DROP CONSTRAINT brands_pkey;
       public            postgres    false    222            b           2606    17960    device_infos device_infos_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.device_infos
    ADD CONSTRAINT device_infos_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.device_infos DROP CONSTRAINT device_infos_pkey;
       public            postgres    false    230            T           2606    17887    devices devices_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.devices DROP CONSTRAINT devices_pkey;
       public            postgres    false    218            `           2606    17941    ratings ratings_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.ratings DROP CONSTRAINT ratings_pkey;
       public            postgres    false    228            d           2606    17972    type_brands type_brands_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.type_brands
    ADD CONSTRAINT type_brands_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.type_brands DROP CONSTRAINT type_brands_pkey;
       public            postgres    false    232            f           2606    17974 *   type_brands type_brands_typeId_brandId_key 
   CONSTRAINT     v   ALTER TABLE ONLY public.type_brands
    ADD CONSTRAINT "type_brands_typeId_brandId_key" UNIQUE ("typeId", "brandId");
 V   ALTER TABLE ONLY public.type_brands DROP CONSTRAINT "type_brands_typeId_brandId_key";
       public            postgres    false    232    232            V           2606    17896    types types_name_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_name_key UNIQUE (name);
 >   ALTER TABLE ONLY public.types DROP CONSTRAINT types_name_key;
       public            postgres    false    220            X           2606    17894    types types_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.types DROP CONSTRAINT types_pkey;
       public            postgres    false    220            P           2606    17878    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            postgres    false    216            R           2606    17876    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            postgres    false    216            h           2606    17925 +   basket_devices basket_devices_basketId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.basket_devices
    ADD CONSTRAINT "basket_devices_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES public.baskets(id) ON UPDATE CASCADE ON DELETE SET NULL;
 W   ALTER TABLE ONLY public.basket_devices DROP CONSTRAINT "basket_devices_basketId_fkey";
       public          postgres    false    224    226    4700            i           2606    17930 +   basket_devices basket_devices_deviceId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.basket_devices
    ADD CONSTRAINT "basket_devices_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE CASCADE ON DELETE SET NULL;
 W   ALTER TABLE ONLY public.basket_devices DROP CONSTRAINT "basket_devices_deviceId_fkey";
       public          postgres    false    4692    218    226            g           2606    17913    baskets baskets_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT "baskets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
 G   ALTER TABLE ONLY public.baskets DROP CONSTRAINT "baskets_userId_fkey";
       public          postgres    false    216    4690    224            l           2606    17961 '   device_infos device_infos_deviceId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.device_infos
    ADD CONSTRAINT "device_infos_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE CASCADE ON DELETE SET NULL;
 S   ALTER TABLE ONLY public.device_infos DROP CONSTRAINT "device_infos_deviceId_fkey";
       public          postgres    false    218    230    4692            j           2606    17947    ratings ratings_deviceId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE CASCADE ON DELETE SET NULL;
 I   ALTER TABLE ONLY public.ratings DROP CONSTRAINT "ratings_deviceId_fkey";
       public          postgres    false    4692    218    228            k           2606    17942    ratings ratings_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
 G   ALTER TABLE ONLY public.ratings DROP CONSTRAINT "ratings_userId_fkey";
       public          postgres    false    216    4690    228            m           2606    17980 $   type_brands type_brands_brandId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.type_brands
    ADD CONSTRAINT "type_brands_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE CASCADE;
 P   ALTER TABLE ONLY public.type_brands DROP CONSTRAINT "type_brands_brandId_fkey";
       public          postgres    false    4698    222    232            n           2606    17975 #   type_brands type_brands_typeId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.type_brands
    ADD CONSTRAINT "type_brands_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.types(id) ON UPDATE CASCADE ON DELETE CASCADE;
 O   ALTER TABLE ONLY public.type_brands DROP CONSTRAINT "type_brands_typeId_fkey";
       public          postgres    false    232    4696    220            	      x������ � �            x������ � �         ;  x�}��n�0Eg�+�!ć����@��A��~)�v刨�s�,QW(�#pd��re�P�\;G�Rߢ���MfG���W>���Ɋ�e_�����j�ʮ| H�6~_��檿 ��쉊%�������5'_�T�u�[���#OZgҖ(�����οI��؄�h跛��X�w��������\�$A��cۜT�"^Y&�c����pR{�dB@i,���bCv�:!�<& ��vdZ� ��B������k�bW��{_P�)���k�&�U>#��;b�5��=��������r:�\8Z�z"�����;�72��3            x������ � �         
  x�}WI�#7<W����IP�����K�g��Ą�,���.UYї��	 ��h���.L=5s-Rv��t6*�޽P(y���?����gu>9�gJ��9����B_>�����������eU�>�����jY ?gIN�Wb�.�\�4c�p/q�A�_C�����cI샟��LLN���3�c)�B��k^�?����"��e��+�8�8����ku<�Y�$5�#�|!�r����S���c�ò�9���k��RMD�No������:��<}-ei��<�ݸ�H��������,����^��.t� �2�b*V�hE��AN���쩎G�`l���B�lc�˷���!:J��tU6%uNV�p=f���k�A�3 �R��4t�TJpf�]/�&C6�������.tʀ�NA��B��$FZ���P�d�DH���J����S�;��yNn �%$h���ČX)>Z�'xM���=tNA��j�pNT!�yW�b�N��C1GV;���9�S�#�1t���'z�:�l9W<G?��k�c-���)�;��e��L6W�3�¹�Ȉk�J��o8�R�{�B���(OhX�}`'	Aѓ3M��P��n)��}6珻<�~|����;Qn�ɜ��鶋��J��R��������VA�������c!_8�Ynܘ�/׿UD��h��d���S�o+��\UK.��H�-�������7ץ��B������lmh�a�,O�n�O�4Z`�~��
���k�����Q�x�*���x������=�/yC�'vy���h��Z_,��e˛���,��9�C�4c�6h�j=R��!��ܝ�@��@�Kʸ���������	j��!�{��|��[�����:=`�9��w���6��}�gFg�*_����r~���ten�'�$�K�EH�5�������w{F�5^�n�t@iV(���B�Z{�b������h4�^}�R���4�h��#���%>�y�/��R�D��6�Ƕ��3��)ljр��4+�����fMX�r�4z�t�\�����pyaC8ˡ�1f�ͶU8��7�<jx�|>F;��߿������ϟ?�>������}������T�e������&�o���c��#��?�@����¨s��
�?�ڋ�7�I�8Km;ç�l���j��r���۽�f=��W�^��_e@/Y+<�o�z~��!���R1$��l�v4wra8���Ӫ����6�_���>==�Q��            x������ � �            x������ � �         b   x�}���0Dѳ]E�(V<v���	��s}�P๴M�-*�)�b?� tx�_�F/�����+/�N�a��p�d��4��[�^��W�6/      �   �  x�}�[o�0��ɯ�P�:>�p���@CN��f%$��JI�N��uԡ�M�o�W��V�m.��g ̥��=�z��x�wk�o����7�_�|j��h5YXIQ8�`F�D���!׆W�㩆!�P\`�E�$Є��A�A��i�qj�z9U�Eo�\��i�����C�H^.�ze���J7��׬8�w��4�h�B痉@-Rͨ�"�T��:�c��ڞ<��:�q�]<���nO7�D�e`�`i�<�JQ�6� ���fT[QM	�Nv��g� ���Ζ\-7�	"ɞVˣC,5�g$�a�S-ʝ���������'�A�sJ �k�K���#�ב"7	V��&!�P�$Tƚ���QScX~>�P+D����4BH�B����'���*�O�����������S:��ر���2������E>F�&@ж�����ϲ�M�t:�w���     
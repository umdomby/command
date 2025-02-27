PGDMP  8                     }            heroes3    17.2    17.2 |    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    17484    heroes3    DATABASE     {   CREATE DATABASE heroes3 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE heroes3;
                     postgres    false                        2615    31685    public    SCHEMA        CREATE SCHEMA public;
    DROP SCHEMA public;
                     postgres    false            �           0    0    SCHEMA public    ACL     +   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
                        postgres    false    5            g           1247    31698 	   BetStatus    TYPE     T   CREATE TYPE public."BetStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'PENDING'
);
    DROP TYPE public."BetStatus";
       public               postgres    false    5            m           1247    31712    PlayerChoice    TYPE     L   CREATE TYPE public."PlayerChoice" AS ENUM (
    'PLAYER1',
    'PLAYER2'
);
 !   DROP TYPE public."PlayerChoice";
       public               postgres    false    5            j           1247    31706    UserRole    TYPE     C   CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);
    DROP TYPE public."UserRole";
       public               postgres    false    5            �            1259    34217    Bet    TABLE     �  CREATE TABLE public."Bet" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "currentOdds1" double precision NOT NULL,
    "currentOdds2" double precision NOT NULL,
    "totalBetAmount" double precision DEFAULT 0 NOT NULL,
    "creatorId" integer NOT NULL,
    status public."BetStatus" DEFAULT 'OPEN'::public."BetStatus" NOT NULL,
    "categoryId" integer,
    "productId" integer,
    "productItemId" integer,
    "winnerId" integer,
    margin double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."Bet";
       public         heap r       postgres    false    871    5    871            �            1259    34236 	   BetCLOSED    TABLE     �  CREATE TABLE public."BetCLOSED" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "currentOdds1" double precision NOT NULL,
    "currentOdds2" double precision NOT NULL,
    "totalBetAmount" double precision DEFAULT 0 NOT NULL,
    "creatorId" integer NOT NULL,
    status public."BetStatus" DEFAULT 'CLOSED'::public."BetStatus" NOT NULL,
    "categoryId" integer,
    "productId" integer,
    "productItemId" integer,
    "winnerId" integer,
    margin double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."BetCLOSED";
       public         heap r       postgres    false    871    5    871            �            1259    34235    BetCLOSED_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetCLOSED_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public."BetCLOSED_id_seq";
       public               postgres    false    230    5            �           0    0    BetCLOSED_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public."BetCLOSED_id_seq" OWNED BY public."BetCLOSED".id;
          public               postgres    false    229            �            1259    34227    BetParticipant    TABLE     �  CREATE TABLE public."BetParticipant" (
    id integer NOT NULL,
    "betId" integer NOT NULL,
    "userId" integer NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    player public."PlayerChoice" NOT NULL,
    margin double precision NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 $   DROP TABLE public."BetParticipant";
       public         heap r       postgres    false    877    5            �            1259    34246    BetParticipantCLOSED    TABLE     �  CREATE TABLE public."BetParticipantCLOSED" (
    id integer NOT NULL,
    "betCLOSEDId" integer NOT NULL,
    "userId" integer NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    player public."PlayerChoice" NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    margin double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 *   DROP TABLE public."BetParticipantCLOSED";
       public         heap r       postgres    false    5    877            �            1259    34245    BetParticipantCLOSED_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipantCLOSED_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public."BetParticipantCLOSED_id_seq";
       public               postgres    false    232    5            �           0    0    BetParticipantCLOSED_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public."BetParticipantCLOSED_id_seq" OWNED BY public."BetParticipantCLOSED".id;
          public               postgres    false    231            �            1259    34226    BetParticipant_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public."BetParticipant_id_seq";
       public               postgres    false    228    5            �           0    0    BetParticipant_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public."BetParticipant_id_seq" OWNED BY public."BetParticipant".id;
          public               postgres    false    227            �            1259    34216 
   Bet_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Bet_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public."Bet_id_seq";
       public               postgres    false    5    226            �           0    0 
   Bet_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public."Bet_id_seq" OWNED BY public."Bet".id;
          public               postgres    false    225            �            1259    34273    Category    TABLE     T   CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL
);
    DROP TABLE public."Category";
       public         heap r       postgres    false    5            �            1259    34272    Category_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."Category_id_seq";
       public               postgres    false    238    5            �           0    0    Category_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;
          public               postgres    false    237            �            1259    34208    ContactDataEnum    TABLE     [   CREATE TABLE public."ContactDataEnum" (
    id integer NOT NULL,
    name text NOT NULL
);
 %   DROP TABLE public."ContactDataEnum";
       public         heap r       postgres    false    5            �            1259    34207    ContactDataEnum_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ContactDataEnum_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."ContactDataEnum_id_seq";
       public               postgres    false    224    5            �           0    0    ContactDataEnum_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."ContactDataEnum_id_seq" OWNED BY public."ContactDataEnum".id;
          public               postgres    false    223            �            1259    34255 
   GlobalData    TABLE       CREATE TABLE public."GlobalData" (
    id integer NOT NULL,
    "usersPlay" integer NOT NULL,
    "pointsBet" double precision NOT NULL,
    users integer NOT NULL,
    "pointsStart" double precision NOT NULL,
    "pointsAllUsers" double precision NOT NULL,
    "pointsAllStart" double precision DEFAULT 1000000,
    "pointsPay" double precision,
    margin double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
     DROP TABLE public."GlobalData";
       public         heap r       postgres    false    5            �            1259    34254    GlobalData_id_seq    SEQUENCE     �   CREATE SEQUENCE public."GlobalData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."GlobalData_id_seq";
       public               postgres    false    234    5            �           0    0    GlobalData_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."GlobalData_id_seq" OWNED BY public."GlobalData".id;
          public               postgres    false    233            �            1259    34200    OrderP2P    TABLE     &  CREATE TABLE public."OrderP2P" (
    id integer NOT NULL,
    user1 integer NOT NULL,
    user2 integer NOT NULL,
    points double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."OrderP2P";
       public         heap r       postgres    false    5            �            1259    34199    OrderP2P_id_seq    SEQUENCE     �   CREATE SEQUENCE public."OrderP2P_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."OrderP2P_id_seq";
       public               postgres    false    5    222            �           0    0    OrderP2P_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."OrderP2P_id_seq" OWNED BY public."OrderP2P".id;
          public               postgres    false    221            �            1259    34190    PageP2P    TABLE     :  CREATE TABLE public."PageP2P" (
    id integer NOT NULL,
    user1 integer NOT NULL,
    user2 integer NOT NULL,
    "chatP2P" jsonb,
    points double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."PageP2P";
       public         heap r       postgres    false    5            �            1259    34189    PageP2P_id_seq    SEQUENCE     �   CREATE SEQUENCE public."PageP2P_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public."PageP2P_id_seq";
       public               postgres    false    220    5            �           0    0    PageP2P_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public."PageP2P_id_seq" OWNED BY public."PageP2P".id;
          public               postgres    false    219            �            1259    34264    Player    TABLE     R   CREATE TABLE public."Player" (
    id integer NOT NULL,
    name text NOT NULL
);
    DROP TABLE public."Player";
       public         heap r       postgres    false    5            �            1259    34263    Player_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Player_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public."Player_id_seq";
       public               postgres    false    5    236            �           0    0    Player_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public."Player_id_seq" OWNED BY public."Player".id;
          public               postgres    false    235            �            1259    34282    Product    TABLE     v   CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer NOT NULL
);
    DROP TABLE public."Product";
       public         heap r       postgres    false    5            �            1259    34291    ProductItem    TABLE     y   CREATE TABLE public."ProductItem" (
    id integer NOT NULL,
    name text NOT NULL,
    "productId" integer NOT NULL
);
 !   DROP TABLE public."ProductItem";
       public         heap r       postgres    false    5            �            1259    34290    ProductItem_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ProductItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public."ProductItem_id_seq";
       public               postgres    false    5    242            �           0    0    ProductItem_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public."ProductItem_id_seq" OWNED BY public."ProductItem".id;
          public               postgres    false    241            �            1259    34281    Product_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public."Product_id_seq";
       public               postgres    false    5    240            �           0    0    Product_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;
          public               postgres    false    239            �            1259    34176    User    TABLE     9  CREATE TABLE public."User" (
    id integer NOT NULL,
    "fullName" text NOT NULL,
    email text NOT NULL,
    provider text,
    "providerId" text,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    img text,
    points double precision DEFAULT 1000 NOT NULL,
    "p2pPlus" integer DEFAULT 0,
    "p2pMinus" integer DEFAULT 0,
    contact jsonb,
    "loginHistory" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."User";
       public         heap r       postgres    false    874    5    874            �            1259    34175    User_id_seq    SEQUENCE     �   CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."User_id_seq";
       public               postgres    false    218    5            �           0    0    User_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;
          public               postgres    false    217            �           2604    34220    Bet id    DEFAULT     d   ALTER TABLE ONLY public."Bet" ALTER COLUMN id SET DEFAULT nextval('public."Bet_id_seq"'::regclass);
 7   ALTER TABLE public."Bet" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225    226            �           2604    34239    BetCLOSED id    DEFAULT     p   ALTER TABLE ONLY public."BetCLOSED" ALTER COLUMN id SET DEFAULT nextval('public."BetCLOSED_id_seq"'::regclass);
 =   ALTER TABLE public."BetCLOSED" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    229    230    230            �           2604    34230    BetParticipant id    DEFAULT     z   ALTER TABLE ONLY public."BetParticipant" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipant_id_seq"'::regclass);
 B   ALTER TABLE public."BetParticipant" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    228    227    228            �           2604    34249    BetParticipantCLOSED id    DEFAULT     �   ALTER TABLE ONLY public."BetParticipantCLOSED" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipantCLOSED_id_seq"'::regclass);
 H   ALTER TABLE public."BetParticipantCLOSED" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231    232            �           2604    34276    Category id    DEFAULT     n   ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);
 <   ALTER TABLE public."Category" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    237    238    238            �           2604    34211    ContactDataEnum id    DEFAULT     |   ALTER TABLE ONLY public."ContactDataEnum" ALTER COLUMN id SET DEFAULT nextval('public."ContactDataEnum_id_seq"'::regclass);
 C   ALTER TABLE public."ContactDataEnum" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    223    224    224            �           2604    34258    GlobalData id    DEFAULT     r   ALTER TABLE ONLY public."GlobalData" ALTER COLUMN id SET DEFAULT nextval('public."GlobalData_id_seq"'::regclass);
 >   ALTER TABLE public."GlobalData" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    234    233    234            �           2604    34203    OrderP2P id    DEFAULT     n   ALTER TABLE ONLY public."OrderP2P" ALTER COLUMN id SET DEFAULT nextval('public."OrderP2P_id_seq"'::regclass);
 <   ALTER TABLE public."OrderP2P" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222            �           2604    34193 
   PageP2P id    DEFAULT     l   ALTER TABLE ONLY public."PageP2P" ALTER COLUMN id SET DEFAULT nextval('public."PageP2P_id_seq"'::regclass);
 ;   ALTER TABLE public."PageP2P" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    220    220            �           2604    34267 	   Player id    DEFAULT     j   ALTER TABLE ONLY public."Player" ALTER COLUMN id SET DEFAULT nextval('public."Player_id_seq"'::regclass);
 :   ALTER TABLE public."Player" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    235    236    236            �           2604    34285 
   Product id    DEFAULT     l   ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);
 ;   ALTER TABLE public."Product" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    239    240    240            �           2604    34294    ProductItem id    DEFAULT     t   ALTER TABLE ONLY public."ProductItem" ALTER COLUMN id SET DEFAULT nextval('public."ProductItem_id_seq"'::regclass);
 ?   ALTER TABLE public."ProductItem" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    241    242    242            �           2604    34179    User id    DEFAULT     f   ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);
 8   ALTER TABLE public."User" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    217    218    218            �          0    34217    Bet 
   TABLE DATA           J  COPY public."Bet" (id, "player1Id", "player2Id", "initBetPlayer1", "initBetPlayer2", "totalBetPlayer1", "totalBetPlayer2", "maxBetPlayer1", "maxBetPlayer2", "currentOdds1", "currentOdds2", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    226   t�       �          0    34236 	   BetCLOSED 
   TABLE DATA           P  COPY public."BetCLOSED" (id, "player1Id", "player2Id", "initBetPlayer1", "initBetPlayer2", "totalBetPlayer1", "totalBetPlayer2", "maxBetPlayer1", "maxBetPlayer2", "currentOdds1", "currentOdds2", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    230   Ѣ       �          0    34227    BetParticipant 
   TABLE DATA           �   COPY public."BetParticipant" (id, "betId", "userId", amount, odds, profit, player, margin, "isWinner", "createdAt") FROM stdin;
    public               postgres    false    228   �       �          0    34246    BetParticipantCLOSED 
   TABLE DATA           �   COPY public."BetParticipantCLOSED" (id, "betCLOSEDId", "userId", amount, odds, profit, player, "isWinner", margin, "createdAt") FROM stdin;
    public               postgres    false    232   �       �          0    34273    Category 
   TABLE DATA           .   COPY public."Category" (id, name) FROM stdin;
    public               postgres    false    238   (�       �          0    34208    ContactDataEnum 
   TABLE DATA           5   COPY public."ContactDataEnum" (id, name) FROM stdin;
    public               postgres    false    224   a�       �          0    34255 
   GlobalData 
   TABLE DATA           �   COPY public."GlobalData" (id, "usersPlay", "pointsBet", users, "pointsStart", "pointsAllUsers", "pointsAllStart", "pointsPay", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    234   ~�       �          0    34200    OrderP2P 
   TABLE DATA           X   COPY public."OrderP2P" (id, user1, user2, points, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    222   У       �          0    34190    PageP2P 
   TABLE DATA           b   COPY public."PageP2P" (id, user1, user2, "chatP2P", points, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    220   ��       �          0    34264    Player 
   TABLE DATA           ,   COPY public."Player" (id, name) FROM stdin;
    public               postgres    false    236   
�       �          0    34282    Product 
   TABLE DATA           ;   COPY public."Product" (id, name, "categoryId") FROM stdin;
    public               postgres    false    240   P�       �          0    34291    ProductItem 
   TABLE DATA           >   COPY public."ProductItem" (id, name, "productId") FROM stdin;
    public               postgres    false    242   ��       �          0    34176    User 
   TABLE DATA           �   COPY public."User" (id, "fullName", email, provider, "providerId", password, role, img, points, "p2pPlus", "p2pMinus", contact, "loginHistory", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    218   �       �           0    0    BetCLOSED_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."BetCLOSED_id_seq"', 10, true);
          public               postgres    false    229            �           0    0    BetParticipantCLOSED_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public."BetParticipantCLOSED_id_seq"', 16, true);
          public               postgres    false    231            �           0    0    BetParticipant_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public."BetParticipant_id_seq"', 35, true);
          public               postgres    false    227            �           0    0 
   Bet_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public."Bet_id_seq"', 14, true);
          public               postgres    false    225            �           0    0    Category_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."Category_id_seq"', 3, true);
          public               postgres    false    237            �           0    0    ContactDataEnum_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public."ContactDataEnum_id_seq"', 1, false);
          public               postgres    false    223            �           0    0    GlobalData_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public."GlobalData_id_seq"', 1, false);
          public               postgres    false    233            �           0    0    OrderP2P_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public."OrderP2P_id_seq"', 1, false);
          public               postgres    false    221            �           0    0    PageP2P_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."PageP2P_id_seq"', 1, false);
          public               postgres    false    219            �           0    0    Player_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public."Player_id_seq"', 1, false);
          public               postgres    false    235            �           0    0    ProductItem_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public."ProductItem_id_seq"', 1, false);
          public               postgres    false    241            �           0    0    Product_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."Product_id_seq"', 1, false);
          public               postgres    false    239            �           0    0    User_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public."User_id_seq"', 4, true);
          public               postgres    false    217            �           2606    34244    BetCLOSED BetCLOSED_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_pkey";
       public                 postgres    false    230            �           2606    34253 .   BetParticipantCLOSED BetParticipantCLOSED_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_pkey" PRIMARY KEY (id);
 \   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_pkey";
       public                 postgres    false    232            �           2606    34234 "   BetParticipant BetParticipant_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_pkey" PRIMARY KEY (id);
 P   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_pkey";
       public                 postgres    false    228            �           2606    34225    Bet Bet_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_pkey" PRIMARY KEY (id);
 :   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_pkey";
       public                 postgres    false    226                       2606    34280    Category Category_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Category" DROP CONSTRAINT "Category_pkey";
       public                 postgres    false    238            �           2606    34215 $   ContactDataEnum ContactDataEnum_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public."ContactDataEnum"
    ADD CONSTRAINT "ContactDataEnum_pkey" PRIMARY KEY (id);
 R   ALTER TABLE ONLY public."ContactDataEnum" DROP CONSTRAINT "ContactDataEnum_pkey";
       public                 postgres    false    224            �           2606    34262    GlobalData GlobalData_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."GlobalData"
    ADD CONSTRAINT "GlobalData_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."GlobalData" DROP CONSTRAINT "GlobalData_pkey";
       public                 postgres    false    234            �           2606    34206    OrderP2P OrderP2P_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."OrderP2P"
    ADD CONSTRAINT "OrderP2P_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."OrderP2P" DROP CONSTRAINT "OrderP2P_pkey";
       public                 postgres    false    222            �           2606    34198    PageP2P PageP2P_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public."PageP2P"
    ADD CONSTRAINT "PageP2P_pkey" PRIMARY KEY (id);
 B   ALTER TABLE ONLY public."PageP2P" DROP CONSTRAINT "PageP2P_pkey";
       public                 postgres    false    220                       2606    34271    Player Player_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public."Player"
    ADD CONSTRAINT "Player_pkey" PRIMARY KEY (id);
 @   ALTER TABLE ONLY public."Player" DROP CONSTRAINT "Player_pkey";
       public                 postgres    false    236            
           2606    34298    ProductItem ProductItem_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."ProductItem"
    ADD CONSTRAINT "ProductItem_pkey" PRIMARY KEY (id);
 J   ALTER TABLE ONLY public."ProductItem" DROP CONSTRAINT "ProductItem_pkey";
       public                 postgres    false    242                       2606    34289    Product Product_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);
 B   ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_pkey";
       public                 postgres    false    240            �           2606    34188    User User_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
       public                 postgres    false    218                       1259    34302    Category_name_key    INDEX     Q   CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);
 '   DROP INDEX public."Category_name_key";
       public                 postgres    false    238            �           1259    34300    ContactDataEnum_name_key    INDEX     _   CREATE UNIQUE INDEX "ContactDataEnum_name_key" ON public."ContactDataEnum" USING btree (name);
 .   DROP INDEX public."ContactDataEnum_name_key";
       public                 postgres    false    224            �           1259    34301    Player_name_key    INDEX     M   CREATE UNIQUE INDEX "Player_name_key" ON public."Player" USING btree (name);
 %   DROP INDEX public."Player_name_key";
       public                 postgres    false    236                       1259    34304    ProductItem_name_key    INDEX     W   CREATE UNIQUE INDEX "ProductItem_name_key" ON public."ProductItem" USING btree (name);
 *   DROP INDEX public."ProductItem_name_key";
       public                 postgres    false    242                       1259    34303    Product_name_key    INDEX     O   CREATE UNIQUE INDEX "Product_name_key" ON public."Product" USING btree (name);
 &   DROP INDEX public."Product_name_key";
       public                 postgres    false    240            �           1259    34299    User_email_key    INDEX     K   CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);
 $   DROP INDEX public."User_email_key";
       public                 postgres    false    218                       2606    34360 #   BetCLOSED BetCLOSED_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 Q   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_categoryId_fkey";
       public               postgres    false    230    238    4868                       2606    34355 "   BetCLOSED BetCLOSED_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_creatorId_fkey";
       public               postgres    false    230    4845    218                       2606    34345 "   BetCLOSED BetCLOSED_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_player1Id_fkey";
       public               postgres    false    4865    236    230                       2606    34350 "   BetCLOSED BetCLOSED_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_player2Id_fkey";
       public               postgres    false    230    4865    236                       2606    34365 "   BetCLOSED BetCLOSED_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_productId_fkey";
       public               postgres    false    240    4871    230                       2606    34370 &   BetCLOSED BetCLOSED_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 T   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_productItemId_fkey";
       public               postgres    false    230    242    4874                       2606    34375 :   BetParticipantCLOSED BetParticipantCLOSED_betCLOSEDId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_betCLOSEDId_fkey" FOREIGN KEY ("betCLOSEDId") REFERENCES public."BetCLOSED"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 h   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_betCLOSEDId_fkey";
       public               postgres    false    230    232    4858                       2606    34380 5   BetParticipantCLOSED BetParticipantCLOSED_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 c   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_userId_fkey";
       public               postgres    false    4845    232    218                       2606    34335 (   BetParticipant BetParticipant_betId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_betId_fkey" FOREIGN KEY ("betId") REFERENCES public."Bet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 V   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_betId_fkey";
       public               postgres    false    226    4854    228                       2606    34340 )   BetParticipant BetParticipant_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 W   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_userId_fkey";
       public               postgres    false    218    4845    228                       2606    34320    Bet Bet_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 E   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_categoryId_fkey";
       public               postgres    false    226    238    4868                       2606    34315    Bet Bet_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_creatorId_fkey";
       public               postgres    false    218    4845    226                       2606    34305    Bet Bet_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_player1Id_fkey";
       public               postgres    false    226    4865    236                       2606    34310    Bet Bet_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_player2Id_fkey";
       public               postgres    false    4865    226    236                       2606    34325    Bet Bet_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_productId_fkey";
       public               postgres    false    240    226    4871                       2606    34330    Bet Bet_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 H   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_productItemId_fkey";
       public               postgres    false    4874    242    226                       2606    34390 &   ProductItem ProductItem_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ProductItem"
    ADD CONSTRAINT "ProductItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 T   ALTER TABLE ONLY public."ProductItem" DROP CONSTRAINT "ProductItem_productId_fkey";
       public               postgres    false    242    4871    240                       2606    34385    Product Product_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 M   ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_categoryId_fkey";
       public               postgres    false    240    238    4868            �   M   x�u��� Cѳ3E Ji�^i`�9J��%K��!�f�i��=�{�}ٚ[h�b^X��c��O�sY*"��      �      x������ � �      �      x������ � �      �      x������ � �      �   )   x�3��KMMQH�/R. ���8��L����1W� �,e      �      x������ � �      �   B   x�E��� C�3�����Y��E�Pɇg��&��w�	ƀ�#+�,4�?T���򨈼D�      �      x������ � �      �      x������ � �      �   6   x�3�,(-��ώ�2���/It�,��2�4r����2����	��p����� 4a�      �   8   x�3���/.QO�+IMQ0200�4�2���t��9C�\\�܃��4����� ]n�      �   A   x�3�t�,�TH-��M-I-�4�2� ���J�ҁ\cN�̜������Ҽ�ĢJ�p� f��      �   �  x��R]o�0}�_�<����<5DJ�$�{�����������l괭/�d_Y�����ce�*���z[��l��h#3��of����t��l<�{R���b��(��8D��m7�[��"�N�&Sfg�4� �4�ܓ ��/i�nRjr���U�`�Wu���A�݀�'�t/�nt�z���6�e���]`�OCv}��S�qc�$z����)e����XK�Q}���b�J�N�"~�O�1�f�S�/��b��#(��O�����ЩHOïF��=8��������w-�kfKú@��BG�1�SK{���N�XFu�������������x�M ��9�6 [�yQ#�˗�\�&�e�br0�@�!*V��l��c};�o���%E���̪z���\vI��zpv��N��h�t{���/�w&�M
��z�TU}�E     
PGDMP                      }            heroes3    17.2    17.2 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    53547    heroes3    DATABASE     {   CREATE DATABASE heroes3 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE heroes3;
                     postgres    false                        2615    100613    public    SCHEMA        CREATE SCHEMA public;
    DROP SCHEMA public;
                     postgres    false            �           0    0    SCHEMA public    ACL     +   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
                        postgres    false    5            {           1247    100624 	   BetStatus    TYPE     T   CREATE TYPE public."BetStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'PENDING'
);
    DROP TYPE public."BetStatus";
       public               postgres    false    5            �           1247    100650    BuySell    TYPE     @   CREATE TYPE public."BuySell" AS ENUM (
    'BUY',
    'SELL'
);
    DROP TYPE public."BuySell";
       public               postgres    false    5            �           1247    100921 	   IsCovered    TYPE     T   CREATE TYPE public."IsCovered" AS ENUM (
    'OPEN',
    'CLOSED',
    'PENDING'
);
    DROP TYPE public."IsCovered";
       public               postgres    false    5            �           1247    100656    OrderP2PStatus    TYPE     v   CREATE TYPE public."OrderP2PStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'RETURN',
    'CONTROL',
    'PENDING'
);
 #   DROP TYPE public."OrderP2PStatus";
       public               postgres    false    5            �           1247    100666    PlayerChoice    TYPE     j   CREATE TYPE public."PlayerChoice" AS ENUM (
    'PLAYER1',
    'PLAYER2',
    'PLAYER3',
    'PLAYER4'
);
 !   DROP TYPE public."PlayerChoice";
       public               postgres    false    5            ~           1247    100632    UserRole    TYPE     P   CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'BANED'
);
    DROP TYPE public."UserRole";
       public               postgres    false    5            �            1259    124385    Bet    TABLE       CREATE TABLE public."Bet" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "oddsBetPlayer1" double precision NOT NULL,
    "oddsBetPlayer2" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "overlapPlayer1" double precision NOT NULL,
    "overlapPlayer2" double precision NOT NULL,
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
       public         heap r       postgres    false    891    891    5            �            1259    124391    Bet3    TABLE     &  CREATE TABLE public."Bet3" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "player3Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "initBetPlayer3" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "totalBetPlayer3" double precision NOT NULL,
    "oddsBetPlayer1" double precision NOT NULL,
    "oddsBetPlayer2" double precision NOT NULL,
    "oddsBetPlayer3" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "maxBetPlayer3" double precision NOT NULL,
    "overlapPlayer1" double precision NOT NULL,
    "overlapPlayer2" double precision NOT NULL,
    "overlapPlayer3" double precision NOT NULL,
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
    DROP TABLE public."Bet3";
       public         heap r       postgres    false    891    5    891            �            1259    124397    Bet3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Bet3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."Bet3_id_seq";
       public               postgres    false    5    218            �           0    0    Bet3_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."Bet3_id_seq" OWNED BY public."Bet3".id;
          public               postgres    false    219            �            1259    124398    Bet4    TABLE     8  CREATE TABLE public."Bet4" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "player3Id" integer NOT NULL,
    "player4Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "initBetPlayer3" double precision NOT NULL,
    "initBetPlayer4" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "totalBetPlayer3" double precision NOT NULL,
    "totalBetPlayer4" double precision NOT NULL,
    "oddsBetPlayer1" double precision NOT NULL,
    "oddsBetPlayer2" double precision NOT NULL,
    "oddsBetPlayer3" double precision NOT NULL,
    "oddsBetPlayer4" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "maxBetPlayer3" double precision NOT NULL,
    "maxBetPlayer4" double precision NOT NULL,
    "overlapPlayer1" double precision NOT NULL,
    "overlapPlayer2" double precision NOT NULL,
    "overlapPlayer3" double precision NOT NULL,
    "overlapPlayer4" double precision NOT NULL,
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
    DROP TABLE public."Bet4";
       public         heap r       postgres    false    891    891    5            �            1259    124404    Bet4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Bet4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."Bet4_id_seq";
       public               postgres    false    5    220            �           0    0    Bet4_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."Bet4_id_seq" OWNED BY public."Bet4".id;
          public               postgres    false    221            �            1259    124405 	   BetCLOSED    TABLE     V  CREATE TABLE public."BetCLOSED" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "oddsBetPlayer1" double precision NOT NULL,
    "oddsBetPlayer2" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "overlapPlayer1" double precision NOT NULL,
    "overlapPlayer2" double precision NOT NULL,
    "totalBetAmount" double precision DEFAULT 0 NOT NULL,
    "returnBetAmount" double precision DEFAULT 0 NOT NULL,
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
       public         heap r       postgres    false    891    5    891            �            1259    124412 
   BetCLOSED3    TABLE     .  CREATE TABLE public."BetCLOSED3" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "player3Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "initBetPlayer3" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "totalBetPlayer3" double precision NOT NULL,
    "oddsBetPlayer1" double precision NOT NULL,
    "oddsBetPlayer2" double precision NOT NULL,
    "oddsBetPlayer3" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "maxBetPlayer3" double precision NOT NULL,
    "overlapPlayer1" double precision NOT NULL,
    "overlapPlayer2" double precision NOT NULL,
    "overlapPlayer3" double precision NOT NULL,
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
     DROP TABLE public."BetCLOSED3";
       public         heap r       postgres    false    891    5    891            �            1259    124418    BetCLOSED3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetCLOSED3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."BetCLOSED3_id_seq";
       public               postgres    false    223    5            �           0    0    BetCLOSED3_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."BetCLOSED3_id_seq" OWNED BY public."BetCLOSED3".id;
          public               postgres    false    224            �            1259    124419 
   BetCLOSED4    TABLE     @  CREATE TABLE public."BetCLOSED4" (
    id integer NOT NULL,
    "player1Id" integer NOT NULL,
    "player2Id" integer NOT NULL,
    "player3Id" integer NOT NULL,
    "player4Id" integer NOT NULL,
    "initBetPlayer1" double precision NOT NULL,
    "initBetPlayer2" double precision NOT NULL,
    "initBetPlayer3" double precision NOT NULL,
    "initBetPlayer4" double precision NOT NULL,
    "totalBetPlayer1" double precision NOT NULL,
    "totalBetPlayer2" double precision NOT NULL,
    "totalBetPlayer3" double precision NOT NULL,
    "totalBetPlayer4" double precision NOT NULL,
    "oddsBetPlayer1" double precision NOT NULL,
    "oddsBetPlayer2" double precision NOT NULL,
    "oddsBetPlayer3" double precision NOT NULL,
    "oddsBetPlayer4" double precision NOT NULL,
    "maxBetPlayer1" double precision NOT NULL,
    "maxBetPlayer2" double precision NOT NULL,
    "maxBetPlayer3" double precision NOT NULL,
    "maxBetPlayer4" double precision NOT NULL,
    "overlapPlayer1" double precision NOT NULL,
    "overlapPlayer2" double precision NOT NULL,
    "overlapPlayer3" double precision NOT NULL,
    "overlapPlayer4" double precision NOT NULL,
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
     DROP TABLE public."BetCLOSED4";
       public         heap r       postgres    false    891    5    891            �            1259    124425    BetCLOSED4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetCLOSED4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."BetCLOSED4_id_seq";
       public               postgres    false    225    5            �           0    0    BetCLOSED4_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."BetCLOSED4_id_seq" OWNED BY public."BetCLOSED4".id;
          public               postgres    false    226            �            1259    124426    BetCLOSED_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetCLOSED_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public."BetCLOSED_id_seq";
       public               postgres    false    5    222            �           0    0    BetCLOSED_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public."BetCLOSED_id_seq" OWNED BY public."BetCLOSED".id;
          public               postgres    false    227            �            1259    124427    BetParticipant    TABLE       CREATE TABLE public."BetParticipant" (
    id integer NOT NULL,
    "betId" integer NOT NULL,
    "userId" integer NOT NULL,
    player public."PlayerChoice" NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    overlap double precision NOT NULL,
    margin double precision NOT NULL,
    "isCovered" public."IsCovered" NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 $   DROP TABLE public."BetParticipant";
       public         heap r       postgres    false    5    903    913            �            1259    124432    BetParticipant3    TABLE       CREATE TABLE public."BetParticipant3" (
    id integer NOT NULL,
    "betId" integer NOT NULL,
    "userId" integer NOT NULL,
    player public."PlayerChoice" NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    overlap double precision NOT NULL,
    margin double precision NOT NULL,
    "isCovered" public."IsCovered" NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 %   DROP TABLE public."BetParticipant3";
       public         heap r       postgres    false    903    5    913            �            1259    124437    BetParticipant3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipant3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."BetParticipant3_id_seq";
       public               postgres    false    229    5            �           0    0    BetParticipant3_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."BetParticipant3_id_seq" OWNED BY public."BetParticipant3".id;
          public               postgres    false    230            �            1259    124438    BetParticipant4    TABLE       CREATE TABLE public."BetParticipant4" (
    id integer NOT NULL,
    "betId" integer NOT NULL,
    "userId" integer NOT NULL,
    player public."PlayerChoice" NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    overlap double precision NOT NULL,
    margin double precision NOT NULL,
    "isCovered" public."IsCovered" NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 %   DROP TABLE public."BetParticipant4";
       public         heap r       postgres    false    913    5    903            �            1259    124443    BetParticipant4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipant4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."BetParticipant4_id_seq";
       public               postgres    false    5    231            �           0    0    BetParticipant4_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."BetParticipant4_id_seq" OWNED BY public."BetParticipant4".id;
          public               postgres    false    232            �            1259    124444    BetParticipantCLOSED    TABLE     H  CREATE TABLE public."BetParticipantCLOSED" (
    id integer NOT NULL,
    "betCLOSEDId" integer NOT NULL,
    "userId" integer NOT NULL,
    player public."PlayerChoice" NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    overlap double precision NOT NULL,
    margin double precision NOT NULL,
    "isCovered" public."IsCovered" NOT NULL,
    return double precision NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 *   DROP TABLE public."BetParticipantCLOSED";
       public         heap r       postgres    false    913    5    903            �            1259    124449    BetParticipantCLOSED3    TABLE     J  CREATE TABLE public."BetParticipantCLOSED3" (
    id integer NOT NULL,
    "betCLOSED3Id" integer NOT NULL,
    "userId" integer NOT NULL,
    player public."PlayerChoice" NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    overlap double precision NOT NULL,
    margin double precision NOT NULL,
    "isCovered" public."IsCovered" NOT NULL,
    return double precision NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 +   DROP TABLE public."BetParticipantCLOSED3";
       public         heap r       postgres    false    913    5    903            �            1259    124454    BetParticipantCLOSED3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipantCLOSED3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public."BetParticipantCLOSED3_id_seq";
       public               postgres    false    5    234            �           0    0    BetParticipantCLOSED3_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public."BetParticipantCLOSED3_id_seq" OWNED BY public."BetParticipantCLOSED3".id;
          public               postgres    false    235            �            1259    124455    BetParticipantCLOSED4    TABLE     J  CREATE TABLE public."BetParticipantCLOSED4" (
    id integer NOT NULL,
    "betCLOSED4Id" integer NOT NULL,
    "userId" integer NOT NULL,
    player public."PlayerChoice" NOT NULL,
    amount double precision NOT NULL,
    odds double precision NOT NULL,
    profit double precision NOT NULL,
    overlap double precision NOT NULL,
    margin double precision NOT NULL,
    "isCovered" public."IsCovered" NOT NULL,
    return double precision NOT NULL,
    "isWinner" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 +   DROP TABLE public."BetParticipantCLOSED4";
       public         heap r       postgres    false    5    903    913            �            1259    124460    BetParticipantCLOSED4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipantCLOSED4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public."BetParticipantCLOSED4_id_seq";
       public               postgres    false    236    5            �           0    0    BetParticipantCLOSED4_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public."BetParticipantCLOSED4_id_seq" OWNED BY public."BetParticipantCLOSED4".id;
          public               postgres    false    237            �            1259    124461    BetParticipantCLOSED_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipantCLOSED_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public."BetParticipantCLOSED_id_seq";
       public               postgres    false    5    233            �           0    0    BetParticipantCLOSED_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public."BetParticipantCLOSED_id_seq" OWNED BY public."BetParticipantCLOSED".id;
          public               postgres    false    238            �            1259    124462    BetParticipant_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public."BetParticipant_id_seq";
       public               postgres    false    228    5            �           0    0    BetParticipant_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public."BetParticipant_id_seq" OWNED BY public."BetParticipant".id;
          public               postgres    false    239            �            1259    124463 
   Bet_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Bet_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public."Bet_id_seq";
       public               postgres    false    217    5            �           0    0 
   Bet_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public."Bet_id_seq" OWNED BY public."Bet".id;
          public               postgres    false    240            �            1259    124464    Category    TABLE     T   CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL
);
    DROP TABLE public."Category";
       public         heap r       postgres    false    5            �            1259    124469    Category_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."Category_id_seq";
       public               postgres    false    241    5            �           0    0    Category_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;
          public               postgres    false    242            �            1259    124470 	   ChatUsers    TABLE     
  CREATE TABLE public."ChatUsers" (
    id integer NOT NULL,
    "chatUserId" integer NOT NULL,
    "chatText" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."ChatUsers";
       public         heap r       postgres    false    5            �            1259    124476    ChatUsers_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ChatUsers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public."ChatUsers_id_seq";
       public               postgres    false    243    5            �           0    0    ChatUsers_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public."ChatUsers_id_seq" OWNED BY public."ChatUsers".id;
          public               postgres    false    244            �            1259    124477 
   GlobalData    TABLE     �  CREATE TABLE public."GlobalData" (
    id integer NOT NULL,
    users integer DEFAULT 0 NOT NULL,
    reg double precision DEFAULT 0,
    ref double precision DEFAULT 0,
    "usersPoints" double precision DEFAULT 0,
    margin double precision DEFAULT 0,
    "openBetsPoints" double precision DEFAULT 0,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
     DROP TABLE public."GlobalData";
       public         heap r       postgres    false    5            �            1259    124487    GlobalData_id_seq    SEQUENCE     �   CREATE SEQUENCE public."GlobalData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."GlobalData_id_seq";
       public               postgres    false    5    245            �           0    0    GlobalData_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."GlobalData_id_seq" OWNED BY public."GlobalData".id;
          public               postgres    false    246            �            1259    124488    OrderP2P    TABLE     �  CREATE TABLE public."OrderP2P" (
    id integer NOT NULL,
    "orderP2PUser1Id" integer NOT NULL,
    "orderP2PUser2Id" integer,
    "orderP2PBuySell" public."BuySell" NOT NULL,
    "orderP2PPoints" double precision NOT NULL,
    "orderP2PPrice" double precision,
    "orderP2PPart" boolean DEFAULT false NOT NULL,
    "orderBankDetails" jsonb NOT NULL,
    "orderP2PStatus" public."OrderP2PStatus" DEFAULT 'OPEN'::public."OrderP2PStatus" NOT NULL,
    "orderP2PCheckUser1" boolean,
    "orderP2PCheckUser2" boolean,
    "orderBankPay" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."OrderP2P";
       public         heap r       postgres    false    900    5    900    897            �            1259    124496    OrderP2P_id_seq    SEQUENCE     �   CREATE SEQUENCE public."OrderP2P_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."OrderP2P_id_seq";
       public               postgres    false    5    247            �           0    0    OrderP2P_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."OrderP2P_id_seq" OWNED BY public."OrderP2P".id;
          public               postgres    false    248            �            1259    124497    Player    TABLE     R   CREATE TABLE public."Player" (
    id integer NOT NULL,
    name text NOT NULL
);
    DROP TABLE public."Player";
       public         heap r       postgres    false    5            �            1259    124502    Player_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Player_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public."Player_id_seq";
       public               postgres    false    249    5            �           0    0    Player_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public."Player_id_seq" OWNED BY public."Player".id;
          public               postgres    false    250            �            1259    124503    Product    TABLE     v   CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer NOT NULL
);
    DROP TABLE public."Product";
       public         heap r       postgres    false    5            �            1259    124508    ProductItem    TABLE     y   CREATE TABLE public."ProductItem" (
    id integer NOT NULL,
    name text NOT NULL,
    "productId" integer NOT NULL
);
 !   DROP TABLE public."ProductItem";
       public         heap r       postgres    false    5            �            1259    124513    ProductItem_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ProductItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public."ProductItem_id_seq";
       public               postgres    false    5    252            �           0    0    ProductItem_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public."ProductItem_id_seq" OWNED BY public."ProductItem".id;
          public               postgres    false    253            �            1259    124514    Product_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public."Product_id_seq";
       public               postgres    false    5    251            �           0    0    Product_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;
          public               postgres    false    254            �            1259    124515    ReferralUserIpAddress    TABLE     �  CREATE TABLE public."ReferralUserIpAddress" (
    id integer NOT NULL,
    "referralUserId" integer NOT NULL,
    "referralIpAddress" text NOT NULL,
    "referralStatus" boolean DEFAULT false NOT NULL,
    "referralPoints" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 +   DROP TABLE public."ReferralUserIpAddress";
       public         heap r       postgres    false    5                        1259    124523    ReferralUserIpAddress_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ReferralUserIpAddress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public."ReferralUserIpAddress_id_seq";
       public               postgres    false    5    255            �           0    0    ReferralUserIpAddress_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public."ReferralUserIpAddress_id_seq" OWNED BY public."ReferralUserIpAddress".id;
          public               postgres    false    256                       1259    124524    Transfer    TABLE     ]  CREATE TABLE public."Transfer" (
    id integer NOT NULL,
    "transferUser1Id" integer NOT NULL,
    "transferUser2Id" integer,
    "transferPoints" double precision NOT NULL,
    "transferStatus" boolean,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."Transfer";
       public         heap r       postgres    false    5                       1259    124528    Transfer_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Transfer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."Transfer_id_seq";
       public               postgres    false    5    257            �           0    0    Transfer_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."Transfer_id_seq" OWNED BY public."Transfer".id;
          public               postgres    false    258                       1259    124529    User    TABLE     �  CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    "cardId" text NOT NULL,
    "fullName" text NOT NULL,
    provider text,
    "providerId" text,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    img text,
    points double precision DEFAULT 0 NOT NULL,
    "p2pPlus" integer DEFAULT 0,
    "p2pMinus" integer DEFAULT 0,
    contact jsonb,
    "loginHistory" jsonb,
    "bankDetails" jsonb,
    telegram text,
    "telegramView" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."User";
       public         heap r       postgres    false    894    894    5                       1259    124540    User_id_seq    SEQUENCE     �   CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."User_id_seq";
       public               postgres    false    5    259            �           0    0    User_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;
          public               postgres    false    260                       1259    124541 	   regPoints    TABLE     "  CREATE TABLE public."regPoints" (
    id integer NOT NULL,
    "regPointsUserId" integer NOT NULL,
    "regPointsPoints" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."regPoints";
       public         heap r       postgres    false    5                       1259    124545    regPoints_id_seq    SEQUENCE     �   CREATE SEQUENCE public."regPoints_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public."regPoints_id_seq";
       public               postgres    false    261    5            �           0    0    regPoints_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public."regPoints_id_seq" OWNED BY public."regPoints".id;
          public               postgres    false    262                       2604    124546    Bet id    DEFAULT     d   ALTER TABLE ONLY public."Bet" ALTER COLUMN id SET DEFAULT nextval('public."Bet_id_seq"'::regclass);
 7   ALTER TABLE public."Bet" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    240    217            
           2604    124547    Bet3 id    DEFAULT     f   ALTER TABLE ONLY public."Bet3" ALTER COLUMN id SET DEFAULT nextval('public."Bet3_id_seq"'::regclass);
 8   ALTER TABLE public."Bet3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    218                       2604    124548    Bet4 id    DEFAULT     f   ALTER TABLE ONLY public."Bet4" ALTER COLUMN id SET DEFAULT nextval('public."Bet4_id_seq"'::regclass);
 8   ALTER TABLE public."Bet4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    220                       2604    124549    BetCLOSED id    DEFAULT     p   ALTER TABLE ONLY public."BetCLOSED" ALTER COLUMN id SET DEFAULT nextval('public."BetCLOSED_id_seq"'::regclass);
 =   ALTER TABLE public."BetCLOSED" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    227    222                       2604    124550    BetCLOSED3 id    DEFAULT     r   ALTER TABLE ONLY public."BetCLOSED3" ALTER COLUMN id SET DEFAULT nextval('public."BetCLOSED3_id_seq"'::regclass);
 >   ALTER TABLE public."BetCLOSED3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223                       2604    124551    BetCLOSED4 id    DEFAULT     r   ALTER TABLE ONLY public."BetCLOSED4" ALTER COLUMN id SET DEFAULT nextval('public."BetCLOSED4_id_seq"'::regclass);
 >   ALTER TABLE public."BetCLOSED4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225                       2604    124552    BetParticipant id    DEFAULT     z   ALTER TABLE ONLY public."BetParticipant" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipant_id_seq"'::regclass);
 B   ALTER TABLE public."BetParticipant" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    239    228            "           2604    124553    BetParticipant3 id    DEFAULT     |   ALTER TABLE ONLY public."BetParticipant3" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipant3_id_seq"'::regclass);
 C   ALTER TABLE public."BetParticipant3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    230    229            %           2604    124554    BetParticipant4 id    DEFAULT     |   ALTER TABLE ONLY public."BetParticipant4" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipant4_id_seq"'::regclass);
 C   ALTER TABLE public."BetParticipant4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231            (           2604    124555    BetParticipantCLOSED id    DEFAULT     �   ALTER TABLE ONLY public."BetParticipantCLOSED" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipantCLOSED_id_seq"'::regclass);
 H   ALTER TABLE public."BetParticipantCLOSED" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    238    233            +           2604    124556    BetParticipantCLOSED3 id    DEFAULT     �   ALTER TABLE ONLY public."BetParticipantCLOSED3" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipantCLOSED3_id_seq"'::regclass);
 I   ALTER TABLE public."BetParticipantCLOSED3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    235    234            .           2604    124557    BetParticipantCLOSED4 id    DEFAULT     �   ALTER TABLE ONLY public."BetParticipantCLOSED4" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipantCLOSED4_id_seq"'::regclass);
 I   ALTER TABLE public."BetParticipantCLOSED4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    237    236            1           2604    124558    Category id    DEFAULT     n   ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);
 <   ALTER TABLE public."Category" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    242    241            2           2604    124559    ChatUsers id    DEFAULT     p   ALTER TABLE ONLY public."ChatUsers" ALTER COLUMN id SET DEFAULT nextval('public."ChatUsers_id_seq"'::regclass);
 =   ALTER TABLE public."ChatUsers" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    244    243            4           2604    124560    GlobalData id    DEFAULT     r   ALTER TABLE ONLY public."GlobalData" ALTER COLUMN id SET DEFAULT nextval('public."GlobalData_id_seq"'::regclass);
 >   ALTER TABLE public."GlobalData" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    246    245            <           2604    124561    OrderP2P id    DEFAULT     n   ALTER TABLE ONLY public."OrderP2P" ALTER COLUMN id SET DEFAULT nextval('public."OrderP2P_id_seq"'::regclass);
 <   ALTER TABLE public."OrderP2P" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    248    247            @           2604    124562 	   Player id    DEFAULT     j   ALTER TABLE ONLY public."Player" ALTER COLUMN id SET DEFAULT nextval('public."Player_id_seq"'::regclass);
 :   ALTER TABLE public."Player" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    250    249            A           2604    124563 
   Product id    DEFAULT     l   ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);
 ;   ALTER TABLE public."Product" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    254    251            B           2604    124564    ProductItem id    DEFAULT     t   ALTER TABLE ONLY public."ProductItem" ALTER COLUMN id SET DEFAULT nextval('public."ProductItem_id_seq"'::regclass);
 ?   ALTER TABLE public."ProductItem" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    253    252            C           2604    124565    ReferralUserIpAddress id    DEFAULT     �   ALTER TABLE ONLY public."ReferralUserIpAddress" ALTER COLUMN id SET DEFAULT nextval('public."ReferralUserIpAddress_id_seq"'::regclass);
 I   ALTER TABLE public."ReferralUserIpAddress" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    256    255            G           2604    124566    Transfer id    DEFAULT     n   ALTER TABLE ONLY public."Transfer" ALTER COLUMN id SET DEFAULT nextval('public."Transfer_id_seq"'::regclass);
 <   ALTER TABLE public."Transfer" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    258    257            I           2604    124567    User id    DEFAULT     f   ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);
 8   ALTER TABLE public."User" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    260    259            P           2604    124568    regPoints id    DEFAULT     p   ALTER TABLE ONLY public."regPoints" ALTER COLUMN id SET DEFAULT nextval('public."regPoints_id_seq"'::regclass);
 =   ALTER TABLE public."regPoints" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    262    261            W          0    124385    Bet 
   TABLE DATA           r  COPY public."Bet" (id, "player1Id", "player2Id", "initBetPlayer1", "initBetPlayer2", "totalBetPlayer1", "totalBetPlayer2", "oddsBetPlayer1", "oddsBetPlayer2", "maxBetPlayer1", "maxBetPlayer2", "overlapPlayer1", "overlapPlayer2", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    217   �s      X          0    124391    Bet3 
   TABLE DATA           �  COPY public."Bet3" (id, "player1Id", "player2Id", "player3Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    218   Et      Z          0    124398    Bet4 
   TABLE DATA           A  COPY public."Bet4" (id, "player1Id", "player2Id", "player3Id", "player4Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "initBetPlayer4", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "totalBetPlayer4", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "oddsBetPlayer4", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "maxBetPlayer4", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "overlapPlayer4", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    220   bt      \          0    124405 	   BetCLOSED 
   TABLE DATA           �  COPY public."BetCLOSED" (id, "player1Id", "player2Id", "initBetPlayer1", "initBetPlayer2", "totalBetPlayer1", "totalBetPlayer2", "oddsBetPlayer1", "oddsBetPlayer2", "maxBetPlayer1", "maxBetPlayer2", "overlapPlayer1", "overlapPlayer2", "totalBetAmount", "returnBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    222   t      ]          0    124412 
   BetCLOSED3 
   TABLE DATA           �  COPY public."BetCLOSED3" (id, "player1Id", "player2Id", "player3Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    223   �t      _          0    124419 
   BetCLOSED4 
   TABLE DATA           G  COPY public."BetCLOSED4" (id, "player1Id", "player2Id", "player3Id", "player4Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "initBetPlayer4", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "totalBetPlayer4", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "oddsBetPlayer4", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "maxBetPlayer4", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "overlapPlayer4", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    225   �t      b          0    124427    BetParticipant 
   TABLE DATA           �   COPY public."BetParticipant" (id, "betId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", "isWinner", "createdAt") FROM stdin;
    public               postgres    false    228   �t      c          0    124432    BetParticipant3 
   TABLE DATA           �   COPY public."BetParticipant3" (id, "betId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", "isWinner", "createdAt") FROM stdin;
    public               postgres    false    229   �u      e          0    124438    BetParticipant4 
   TABLE DATA           �   COPY public."BetParticipant4" (id, "betId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", "isWinner", "createdAt") FROM stdin;
    public               postgres    false    231   �u      g          0    124444    BetParticipantCLOSED 
   TABLE DATA           �   COPY public."BetParticipantCLOSED" (id, "betCLOSEDId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", return, "isWinner", "createdAt") FROM stdin;
    public               postgres    false    233   �u      h          0    124449    BetParticipantCLOSED3 
   TABLE DATA           �   COPY public."BetParticipantCLOSED3" (id, "betCLOSED3Id", "userId", player, amount, odds, profit, overlap, margin, "isCovered", return, "isWinner", "createdAt") FROM stdin;
    public               postgres    false    234   �u      j          0    124455    BetParticipantCLOSED4 
   TABLE DATA           �   COPY public."BetParticipantCLOSED4" (id, "betCLOSED4Id", "userId", player, amount, odds, profit, overlap, margin, "isCovered", return, "isWinner", "createdAt") FROM stdin;
    public               postgres    false    236   v      o          0    124464    Category 
   TABLE DATA           .   COPY public."Category" (id, name) FROM stdin;
    public               postgres    false    241   "v      q          0    124470 	   ChatUsers 
   TABLE DATA           ]   COPY public."ChatUsers" (id, "chatUserId", "chatText", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    243   Mv      s          0    124477 
   GlobalData 
   TABLE DATA           ~   COPY public."GlobalData" (id, users, reg, ref, "usersPoints", margin, "openBetsPoints", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    245   jv      u          0    124488    OrderP2P 
   TABLE DATA             COPY public."OrderP2P" (id, "orderP2PUser1Id", "orderP2PUser2Id", "orderP2PBuySell", "orderP2PPoints", "orderP2PPrice", "orderP2PPart", "orderBankDetails", "orderP2PStatus", "orderP2PCheckUser1", "orderP2PCheckUser2", "orderBankPay", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    247   �v      w          0    124497    Player 
   TABLE DATA           ,   COPY public."Player" (id, name) FROM stdin;
    public               postgres    false    249   �v      y          0    124503    Product 
   TABLE DATA           ;   COPY public."Product" (id, name, "categoryId") FROM stdin;
    public               postgres    false    251   ~x      z          0    124508    ProductItem 
   TABLE DATA           >   COPY public."ProductItem" (id, name, "productId") FROM stdin;
    public               postgres    false    252   �x      }          0    124515    ReferralUserIpAddress 
   TABLE DATA           �   COPY public."ReferralUserIpAddress" (id, "referralUserId", "referralIpAddress", "referralStatus", "referralPoints", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    255   �x                0    124524    Transfer 
   TABLE DATA           �   COPY public."Transfer" (id, "transferUser1Id", "transferUser2Id", "transferPoints", "transferStatus", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    257   �x      �          0    124529    User 
   TABLE DATA           �   COPY public."User" (id, email, "cardId", "fullName", provider, "providerId", password, role, img, points, "p2pPlus", "p2pMinus", contact, "loginHistory", "bankDetails", telegram, "telegramView", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    259    y      �          0    124541 	   regPoints 
   TABLE DATA           i   COPY public."regPoints" (id, "regPointsUserId", "regPointsPoints", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    261   2~      �           0    0    Bet3_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public."Bet3_id_seq"', 1, false);
          public               postgres    false    219            �           0    0    Bet4_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public."Bet4_id_seq"', 1, false);
          public               postgres    false    221            �           0    0    BetCLOSED3_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public."BetCLOSED3_id_seq"', 1, false);
          public               postgres    false    224            �           0    0    BetCLOSED4_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public."BetCLOSED4_id_seq"', 1, false);
          public               postgres    false    226            �           0    0    BetCLOSED_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."BetCLOSED_id_seq"', 1, false);
          public               postgres    false    227            �           0    0    BetParticipant3_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public."BetParticipant3_id_seq"', 1, false);
          public               postgres    false    230            �           0    0    BetParticipant4_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public."BetParticipant4_id_seq"', 1, false);
          public               postgres    false    232            �           0    0    BetParticipantCLOSED3_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public."BetParticipantCLOSED3_id_seq"', 1, false);
          public               postgres    false    235            �           0    0    BetParticipantCLOSED4_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public."BetParticipantCLOSED4_id_seq"', 1, false);
          public               postgres    false    237            �           0    0    BetParticipantCLOSED_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public."BetParticipantCLOSED_id_seq"', 1, false);
          public               postgres    false    238            �           0    0    BetParticipant_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public."BetParticipant_id_seq"', 5, true);
          public               postgres    false    239            �           0    0 
   Bet_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public."Bet_id_seq"', 2, true);
          public               postgres    false    240            �           0    0    Category_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."Category_id_seq"', 1, true);
          public               postgres    false    242            �           0    0    ChatUsers_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."ChatUsers_id_seq"', 1, false);
          public               postgres    false    244            �           0    0    GlobalData_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."GlobalData_id_seq"', 1, true);
          public               postgres    false    246            �           0    0    OrderP2P_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public."OrderP2P_id_seq"', 1, false);
          public               postgres    false    248            �           0    0    Player_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public."Player_id_seq"', 1, false);
          public               postgres    false    250            �           0    0    ProductItem_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public."ProductItem_id_seq"', 1, false);
          public               postgres    false    253            �           0    0    Product_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."Product_id_seq"', 1, false);
          public               postgres    false    254            �           0    0    ReferralUserIpAddress_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public."ReferralUserIpAddress_id_seq"', 1, false);
          public               postgres    false    256            �           0    0    Transfer_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public."Transfer_id_seq"', 1, false);
          public               postgres    false    258            �           0    0    User_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public."User_id_seq"', 5, true);
          public               postgres    false    260            �           0    0    regPoints_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."regPoints_id_seq"', 1, false);
          public               postgres    false    262            U           2606    124570    Bet3 Bet3_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_pkey";
       public                 postgres    false    218            W           2606    124572    Bet4 Bet4_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_pkey";
       public                 postgres    false    220            [           2606    124574    BetCLOSED3 BetCLOSED3_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_pkey";
       public                 postgres    false    223            ]           2606    124576    BetCLOSED4 BetCLOSED4_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_pkey";
       public                 postgres    false    225            Y           2606    124578    BetCLOSED BetCLOSED_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_pkey";
       public                 postgres    false    222            a           2606    124580 $   BetParticipant3 BetParticipant3_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public."BetParticipant3"
    ADD CONSTRAINT "BetParticipant3_pkey" PRIMARY KEY (id);
 R   ALTER TABLE ONLY public."BetParticipant3" DROP CONSTRAINT "BetParticipant3_pkey";
       public                 postgres    false    229            c           2606    124582 $   BetParticipant4 BetParticipant4_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public."BetParticipant4"
    ADD CONSTRAINT "BetParticipant4_pkey" PRIMARY KEY (id);
 R   ALTER TABLE ONLY public."BetParticipant4" DROP CONSTRAINT "BetParticipant4_pkey";
       public                 postgres    false    231            g           2606    124584 0   BetParticipantCLOSED3 BetParticipantCLOSED3_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public."BetParticipantCLOSED3"
    ADD CONSTRAINT "BetParticipantCLOSED3_pkey" PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public."BetParticipantCLOSED3" DROP CONSTRAINT "BetParticipantCLOSED3_pkey";
       public                 postgres    false    234            i           2606    124586 0   BetParticipantCLOSED4 BetParticipantCLOSED4_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public."BetParticipantCLOSED4"
    ADD CONSTRAINT "BetParticipantCLOSED4_pkey" PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public."BetParticipantCLOSED4" DROP CONSTRAINT "BetParticipantCLOSED4_pkey";
       public                 postgres    false    236            e           2606    124588 .   BetParticipantCLOSED BetParticipantCLOSED_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_pkey" PRIMARY KEY (id);
 \   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_pkey";
       public                 postgres    false    233            _           2606    124590 "   BetParticipant BetParticipant_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_pkey" PRIMARY KEY (id);
 P   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_pkey";
       public                 postgres    false    228            S           2606    124592    Bet Bet_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_pkey" PRIMARY KEY (id);
 :   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_pkey";
       public                 postgres    false    217            l           2606    124594    Category Category_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Category" DROP CONSTRAINT "Category_pkey";
       public                 postgres    false    241            n           2606    124596    ChatUsers ChatUsers_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."ChatUsers"
    ADD CONSTRAINT "ChatUsers_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."ChatUsers" DROP CONSTRAINT "ChatUsers_pkey";
       public                 postgres    false    243            p           2606    124598    GlobalData GlobalData_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."GlobalData"
    ADD CONSTRAINT "GlobalData_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."GlobalData" DROP CONSTRAINT "GlobalData_pkey";
       public                 postgres    false    245            r           2606    124600    OrderP2P OrderP2P_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."OrderP2P"
    ADD CONSTRAINT "OrderP2P_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."OrderP2P" DROP CONSTRAINT "OrderP2P_pkey";
       public                 postgres    false    247            u           2606    124602    Player Player_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public."Player"
    ADD CONSTRAINT "Player_pkey" PRIMARY KEY (id);
 @   ALTER TABLE ONLY public."Player" DROP CONSTRAINT "Player_pkey";
       public                 postgres    false    249            {           2606    124604    ProductItem ProductItem_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."ProductItem"
    ADD CONSTRAINT "ProductItem_pkey" PRIMARY KEY (id);
 J   ALTER TABLE ONLY public."ProductItem" DROP CONSTRAINT "ProductItem_pkey";
       public                 postgres    false    252            x           2606    124606    Product Product_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);
 B   ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_pkey";
       public                 postgres    false    251            }           2606    124608 0   ReferralUserIpAddress ReferralUserIpAddress_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public."ReferralUserIpAddress"
    ADD CONSTRAINT "ReferralUserIpAddress_pkey" PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public."ReferralUserIpAddress" DROP CONSTRAINT "ReferralUserIpAddress_pkey";
       public                 postgres    false    255                       2606    124610    Transfer Transfer_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Transfer" DROP CONSTRAINT "Transfer_pkey";
       public                 postgres    false    257            �           2606    124612    User User_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
       public                 postgres    false    259            �           2606    124614    regPoints regPoints_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."regPoints"
    ADD CONSTRAINT "regPoints_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."regPoints" DROP CONSTRAINT "regPoints_pkey";
       public                 postgres    false    261            j           1259    124615    Category_name_key    INDEX     Q   CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);
 '   DROP INDEX public."Category_name_key";
       public                 postgres    false    241            s           1259    124616    Player_name_key    INDEX     M   CREATE UNIQUE INDEX "Player_name_key" ON public."Player" USING btree (name);
 %   DROP INDEX public."Player_name_key";
       public                 postgres    false    249            y           1259    124617    ProductItem_name_key    INDEX     W   CREATE UNIQUE INDEX "ProductItem_name_key" ON public."ProductItem" USING btree (name);
 *   DROP INDEX public."ProductItem_name_key";
       public                 postgres    false    252            v           1259    124618    Product_name_key    INDEX     O   CREATE UNIQUE INDEX "Product_name_key" ON public."Product" USING btree (name);
 &   DROP INDEX public."Product_name_key";
       public                 postgres    false    251            �           1259    124619    User_cardId_key    INDEX     O   CREATE UNIQUE INDEX "User_cardId_key" ON public."User" USING btree ("cardId");
 %   DROP INDEX public."User_cardId_key";
       public                 postgres    false    259            �           1259    124620    User_email_key    INDEX     K   CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);
 $   DROP INDEX public."User_email_key";
       public                 postgres    false    259            �           1259    124621    User_telegram_key    INDEX     Q   CREATE UNIQUE INDEX "User_telegram_key" ON public."User" USING btree (telegram);
 '   DROP INDEX public."User_telegram_key";
       public                 postgres    false    259            �           2606    124622    Bet3 Bet3_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 G   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_categoryId_fkey";
       public               postgres    false    4972    218    241            �           2606    124627    Bet3 Bet3_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_creatorId_fkey";
       public               postgres    false    4995    259    218            �           2606    124632    Bet3 Bet3_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_player1Id_fkey";
       public               postgres    false    4981    249    218            �           2606    124637    Bet3 Bet3_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_player2Id_fkey";
       public               postgres    false    218    249    4981            �           2606    124642    Bet3 Bet3_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_player3Id_fkey";
       public               postgres    false    4981    249    218            �           2606    124647    Bet3 Bet3_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_productId_fkey";
       public               postgres    false    251    218    4984            �           2606    124652    Bet3 Bet3_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 J   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_productItemId_fkey";
       public               postgres    false    4987    252    218            �           2606    124657    Bet4 Bet4_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 G   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_categoryId_fkey";
       public               postgres    false    241    220    4972            �           2606    124662    Bet4 Bet4_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_creatorId_fkey";
       public               postgres    false    259    220    4995            �           2606    124667    Bet4 Bet4_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player1Id_fkey";
       public               postgres    false    220    4981    249            �           2606    124672    Bet4 Bet4_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player2Id_fkey";
       public               postgres    false    249    220    4981            �           2606    124677    Bet4 Bet4_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player3Id_fkey";
       public               postgres    false    220    249    4981            �           2606    124682    Bet4 Bet4_player4Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player4Id_fkey";
       public               postgres    false    4981    220    249            �           2606    124687    Bet4 Bet4_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_productId_fkey";
       public               postgres    false    4984    251    220            �           2606    124692    Bet4 Bet4_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 J   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_productItemId_fkey";
       public               postgres    false    220    252    4987            �           2606    124697 %   BetCLOSED3 BetCLOSED3_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 S   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_categoryId_fkey";
       public               postgres    false    4972    241    223            �           2606    124702 $   BetCLOSED3 BetCLOSED3_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_creatorId_fkey";
       public               postgres    false    4995    259    223            �           2606    124707 $   BetCLOSED3 BetCLOSED3_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_player1Id_fkey";
       public               postgres    false    249    4981    223            �           2606    124712 $   BetCLOSED3 BetCLOSED3_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_player2Id_fkey";
       public               postgres    false    249    223    4981            �           2606    124717 $   BetCLOSED3 BetCLOSED3_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_player3Id_fkey";
       public               postgres    false    4981    249    223            �           2606    124722 $   BetCLOSED3 BetCLOSED3_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_productId_fkey";
       public               postgres    false    223    251    4984            �           2606    124727 (   BetCLOSED3 BetCLOSED3_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 V   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_productItemId_fkey";
       public               postgres    false    223    252    4987            �           2606    124732 %   BetCLOSED4 BetCLOSED4_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 S   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_categoryId_fkey";
       public               postgres    false    241    4972    225            �           2606    124737 $   BetCLOSED4 BetCLOSED4_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_creatorId_fkey";
       public               postgres    false    259    225    4995            �           2606    124742 $   BetCLOSED4 BetCLOSED4_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player1Id_fkey";
       public               postgres    false    249    4981    225            �           2606    124747 $   BetCLOSED4 BetCLOSED4_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player2Id_fkey";
       public               postgres    false    225    4981    249            �           2606    124752 $   BetCLOSED4 BetCLOSED4_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player3Id_fkey";
       public               postgres    false    225    249    4981            �           2606    124757 $   BetCLOSED4 BetCLOSED4_player4Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player4Id_fkey";
       public               postgres    false    249    4981    225            �           2606    124762 $   BetCLOSED4 BetCLOSED4_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_productId_fkey";
       public               postgres    false    4984    225    251            �           2606    124767 (   BetCLOSED4 BetCLOSED4_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 V   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_productItemId_fkey";
       public               postgres    false    4987    225    252            �           2606    124772 #   BetCLOSED BetCLOSED_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 Q   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_categoryId_fkey";
       public               postgres    false    222    4972    241            �           2606    124777 "   BetCLOSED BetCLOSED_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_creatorId_fkey";
       public               postgres    false    222    259    4995            �           2606    124782 "   BetCLOSED BetCLOSED_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_player1Id_fkey";
       public               postgres    false    4981    249    222            �           2606    124787 "   BetCLOSED BetCLOSED_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_player2Id_fkey";
       public               postgres    false    249    4981    222            �           2606    124792 "   BetCLOSED BetCLOSED_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_productId_fkey";
       public               postgres    false    251    222    4984            �           2606    124797 &   BetCLOSED BetCLOSED_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 T   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_productItemId_fkey";
       public               postgres    false    222    252    4987            �           2606    124802 *   BetParticipant3 BetParticipant3_betId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant3"
    ADD CONSTRAINT "BetParticipant3_betId_fkey" FOREIGN KEY ("betId") REFERENCES public."Bet3"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 X   ALTER TABLE ONLY public."BetParticipant3" DROP CONSTRAINT "BetParticipant3_betId_fkey";
       public               postgres    false    218    229    4949            �           2606    124807 +   BetParticipant3 BetParticipant3_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant3"
    ADD CONSTRAINT "BetParticipant3_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Y   ALTER TABLE ONLY public."BetParticipant3" DROP CONSTRAINT "BetParticipant3_userId_fkey";
       public               postgres    false    4995    229    259            �           2606    124812 *   BetParticipant4 BetParticipant4_betId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant4"
    ADD CONSTRAINT "BetParticipant4_betId_fkey" FOREIGN KEY ("betId") REFERENCES public."Bet4"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 X   ALTER TABLE ONLY public."BetParticipant4" DROP CONSTRAINT "BetParticipant4_betId_fkey";
       public               postgres    false    231    4951    220            �           2606    124817 +   BetParticipant4 BetParticipant4_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant4"
    ADD CONSTRAINT "BetParticipant4_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Y   ALTER TABLE ONLY public."BetParticipant4" DROP CONSTRAINT "BetParticipant4_userId_fkey";
       public               postgres    false    231    4995    259            �           2606    124822 =   BetParticipantCLOSED3 BetParticipantCLOSED3_betCLOSED3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED3"
    ADD CONSTRAINT "BetParticipantCLOSED3_betCLOSED3Id_fkey" FOREIGN KEY ("betCLOSED3Id") REFERENCES public."BetCLOSED3"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 k   ALTER TABLE ONLY public."BetParticipantCLOSED3" DROP CONSTRAINT "BetParticipantCLOSED3_betCLOSED3Id_fkey";
       public               postgres    false    223    234    4955            �           2606    124827 7   BetParticipantCLOSED3 BetParticipantCLOSED3_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED3"
    ADD CONSTRAINT "BetParticipantCLOSED3_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 e   ALTER TABLE ONLY public."BetParticipantCLOSED3" DROP CONSTRAINT "BetParticipantCLOSED3_userId_fkey";
       public               postgres    false    234    4995    259            �           2606    124832 =   BetParticipantCLOSED4 BetParticipantCLOSED4_betCLOSED4Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED4"
    ADD CONSTRAINT "BetParticipantCLOSED4_betCLOSED4Id_fkey" FOREIGN KEY ("betCLOSED4Id") REFERENCES public."BetCLOSED4"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 k   ALTER TABLE ONLY public."BetParticipantCLOSED4" DROP CONSTRAINT "BetParticipantCLOSED4_betCLOSED4Id_fkey";
       public               postgres    false    236    4957    225            �           2606    124837 7   BetParticipantCLOSED4 BetParticipantCLOSED4_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED4"
    ADD CONSTRAINT "BetParticipantCLOSED4_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 e   ALTER TABLE ONLY public."BetParticipantCLOSED4" DROP CONSTRAINT "BetParticipantCLOSED4_userId_fkey";
       public               postgres    false    236    4995    259            �           2606    124842 :   BetParticipantCLOSED BetParticipantCLOSED_betCLOSEDId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_betCLOSEDId_fkey" FOREIGN KEY ("betCLOSEDId") REFERENCES public."BetCLOSED"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 h   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_betCLOSEDId_fkey";
       public               postgres    false    233    4953    222            �           2606    124847 5   BetParticipantCLOSED BetParticipantCLOSED_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 c   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_userId_fkey";
       public               postgres    false    233    259    4995            �           2606    124852 (   BetParticipant BetParticipant_betId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_betId_fkey" FOREIGN KEY ("betId") REFERENCES public."Bet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 V   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_betId_fkey";
       public               postgres    false    217    228    4947            �           2606    124857 )   BetParticipant BetParticipant_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 W   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_userId_fkey";
       public               postgres    false    4995    228    259            �           2606    124862    Bet Bet_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 E   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_categoryId_fkey";
       public               postgres    false    4972    217    241            �           2606    124867    Bet Bet_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_creatorId_fkey";
       public               postgres    false    217    4995    259            �           2606    124872    Bet Bet_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_player1Id_fkey";
       public               postgres    false    249    4981    217            �           2606    124877    Bet Bet_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_player2Id_fkey";
       public               postgres    false    217    4981    249            �           2606    124882    Bet Bet_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_productId_fkey";
       public               postgres    false    4984    217    251            �           2606    124887    Bet Bet_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 H   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_productItemId_fkey";
       public               postgres    false    217    4987    252            �           2606    124892 #   ChatUsers ChatUsers_chatUserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ChatUsers"
    ADD CONSTRAINT "ChatUsers_chatUserId_fkey" FOREIGN KEY ("chatUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Q   ALTER TABLE ONLY public."ChatUsers" DROP CONSTRAINT "ChatUsers_chatUserId_fkey";
       public               postgres    false    259    4995    243            �           2606    124897 &   OrderP2P OrderP2P_orderP2PUser1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."OrderP2P"
    ADD CONSTRAINT "OrderP2P_orderP2PUser1Id_fkey" FOREIGN KEY ("orderP2PUser1Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 T   ALTER TABLE ONLY public."OrderP2P" DROP CONSTRAINT "OrderP2P_orderP2PUser1Id_fkey";
       public               postgres    false    247    259    4995            �           2606    124902 &   OrderP2P OrderP2P_orderP2PUser2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."OrderP2P"
    ADD CONSTRAINT "OrderP2P_orderP2PUser2Id_fkey" FOREIGN KEY ("orderP2PUser2Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 T   ALTER TABLE ONLY public."OrderP2P" DROP CONSTRAINT "OrderP2P_orderP2PUser2Id_fkey";
       public               postgres    false    259    4995    247            �           2606    124907 &   ProductItem ProductItem_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ProductItem"
    ADD CONSTRAINT "ProductItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 T   ALTER TABLE ONLY public."ProductItem" DROP CONSTRAINT "ProductItem_productId_fkey";
       public               postgres    false    251    4984    252            �           2606    124912    Product Product_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 M   ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_categoryId_fkey";
       public               postgres    false    251    241    4972            �           2606    124917 ?   ReferralUserIpAddress ReferralUserIpAddress_referralUserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ReferralUserIpAddress"
    ADD CONSTRAINT "ReferralUserIpAddress_referralUserId_fkey" FOREIGN KEY ("referralUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 m   ALTER TABLE ONLY public."ReferralUserIpAddress" DROP CONSTRAINT "ReferralUserIpAddress_referralUserId_fkey";
       public               postgres    false    259    4995    255            �           2606    124922 &   Transfer Transfer_transferUser1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_transferUser1Id_fkey" FOREIGN KEY ("transferUser1Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 T   ALTER TABLE ONLY public."Transfer" DROP CONSTRAINT "Transfer_transferUser1Id_fkey";
       public               postgres    false    259    257    4995            �           2606    124927 &   Transfer Transfer_transferUser2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_transferUser2Id_fkey" FOREIGN KEY ("transferUser2Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 T   ALTER TABLE ONLY public."Transfer" DROP CONSTRAINT "Transfer_transferUser2Id_fkey";
       public               postgres    false    257    259    4995            �           2606    124932 (   regPoints regPoints_regPointsUserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."regPoints"
    ADD CONSTRAINT "regPoints_regPointsUserId_fkey" FOREIGN KEY ("regPointsUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 V   ALTER TABLE ONLY public."regPoints" DROP CONSTRAINT "regPoints_regPointsUserId_fkey";
       public               postgres    false    4995    261    259            W   o   x���A�@���~ {��{�i�����-=T�������ה�u�J_��\�t���͹!���'���/_y#d
Ɛf�C؆ Y ����!�r��'�li������x$S      X      x������ � �      Z      x������ � �      \      x������ � �      ]      x������ � �      _      x������ � �      b   �   x�}�M
�@�יSx��$���Nl���+���?���%�@�G�x]��c�1Ȳȧ	N�|zx��XG�q:Pm�W,*a9��ק���MV݃Č9����������1�(%�&���Cb��P���\���L�JiLH��m^��s�7y��5�4�Z����	>}      c      x������ � �      e      x������ � �      g      x������ � �      h      x������ � �      j      x������ � �      o      x�3��JM*-Vp.�/.����� 8      q      x������ � �      s   A   x�M���0�7T���`A-��g�.)�u���`��.�=�	�~��9��4t�1U� �F�      u      x������ � �      w   �  x���n�0E�3S���Z:ij�S�l�(@�-F"$�N�/�� w�s�e0�Q�N"���ѮG�iWn0���z߮q{�A9i?���q9냡�
�ێp��([�K(�D���\�i\A�{.��˺@��Q՟-逌�I����q�>8
A52�c��5�b��A����(�����+�:ds�#��g�^�=���Ȗp�{��������,�sy#���Z?r
:�s�2u�x���'�^7Y��A��Z�9�52fp�������r��%�X�G{p���k6�+�ؓQE�-W����4ʡ�P�VO2eD��9�����M�b;D���W'sت��M[��@,ଜ5�K8�{ZNwi�V����G�ܷ�<�s��x� �?�<��      y      x�3���4����� r�      z      x�3���4����� r�      }      x������ � �            x������ � �      �   "  x��[OGǟ�O�ByH$0s��)��`.��L�_ ����V�I����IU�jSE� �-I��+��B>IϚ\pBlG�� �ڻ�ٙ�sf���f��B���z�F�PY��֫��"��B��H�}G�z&�^"�K]�ޙ�ΎЍy�W�H�(�L+97\!�\����N4��/�\2���1?2;�̅�`�9~N����Z��8wfg�g�qg<粛�te`�بWJ�j^����^���DE�JJR����P\*�4.U�����ze�YY�����9��^W�X/{[��k��沗��Vd��[N�m��������9��=s�:0O���<�4h���7�9�=6Gp~�̍�$���a3�)�D
B�v0&���n"�y̓����a�m,�A�h.iO-����hv�s��s��	��Ek�A(�N�ʕ�|��<3G��c�9���Im�a�[p>1ǃN����5P��c�u.��n����'�����d~7�:/��w�O��!��3(:�,9�����:hB���鷻��;�z4�Z��.4��u�P/wu'Ha����8���Pb��M���H��,B�����+����5F��\;Hv�#�Ӄ���s	�:��/�� ���SJf\�O6���'X�V�[�A[}���_:p��Roo�;�r��)��Vb]3�`h�U�P6�%�#y_�J�B�"����t�;b�/�����t�3K��;��v��֡���(=���?�1�
a����W����|�އ�C�p<l�>{`~_݅�>�NK�'���Gt:�.D�$� &���cε�u7w�g]?#��e��+|[�D�"CX8Hǉ�S\}�<�#ث���3��V@�K��ae'����ds�6?��v�r�/mm����bQ�/���Ȥ�ʇwWܵ �H�'�Y&�Lh��2�eB˄�	-Z&�?�0d��B٬�׫��3��f�����
�ln�$��z%�2�:��:��T=��ʫ�^&���W�j3�X��p&XY��#��2�BZ0�`h�Ђ�C�|��`h����Sx�e���4JNѐҳd˔�B.%e($C��+í�z~o����K����rk1��kn��-#�������$M�T1�\�ٷ#k�X�-Z0�`h��b/�-~�`H?╡�cC�D�)�3X�	I�V�c�)`a'�u7��Q����b�Hk�
r�Hp��ZXS�l�m!�,75՘��Hz�݋x��C�-Z0��K�C��/�
[�f���|k�I��81.h�z,�����      �      x������ � �     
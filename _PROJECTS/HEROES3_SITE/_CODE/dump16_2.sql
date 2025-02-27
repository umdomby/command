PGDMP                      }            heroes3    17.2    17.2 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
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
       public               postgres    false    5            �            1259    119244    Bet    TABLE       CREATE TABLE public."Bet" (
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
       public         heap r       postgres    false    891    5    891            �            1259    119353    Bet3    TABLE     &  CREATE TABLE public."Bet3" (
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
       public         heap r       postgres    false    891    5    891            �            1259    119352    Bet3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Bet3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."Bet3_id_seq";
       public               postgres    false    248    5            �           0    0    Bet3_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."Bet3_id_seq" OWNED BY public."Bet3".id;
          public               postgres    false    247                        1259    119391    Bet4    TABLE     8  CREATE TABLE public."Bet4" (
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
       public         heap r       postgres    false    891    5    891            �            1259    119390    Bet4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Bet4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."Bet4_id_seq";
       public               postgres    false    5    256            �           0    0    Bet4_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."Bet4_id_seq" OWNED BY public."Bet4".id;
          public               postgres    false    255            �            1259    119263 	   BetCLOSED    TABLE     V  CREATE TABLE public."BetCLOSED" (
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
       public         heap r       postgres    false    891    891    5            �            1259    119372 
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
       public         heap r       postgres    false    891    5    891            �            1259    119371    BetCLOSED3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetCLOSED3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."BetCLOSED3_id_seq";
       public               postgres    false    5    252            �           0    0    BetCLOSED3_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."BetCLOSED3_id_seq" OWNED BY public."BetCLOSED3".id;
          public               postgres    false    251                       1259    119410 
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
       public         heap r       postgres    false    891    5    891                       1259    119409    BetCLOSED4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetCLOSED4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."BetCLOSED4_id_seq";
       public               postgres    false    5    260            �           0    0    BetCLOSED4_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."BetCLOSED4_id_seq" OWNED BY public."BetCLOSED4".id;
          public               postgres    false    259            �            1259    119262    BetCLOSED_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetCLOSED_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public."BetCLOSED_id_seq";
       public               postgres    false    230    5            �           0    0    BetCLOSED_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public."BetCLOSED_id_seq" OWNED BY public."BetCLOSED".id;
          public               postgres    false    229            �            1259    119254    BetParticipant    TABLE       CREATE TABLE public."BetParticipant" (
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
       public         heap r       postgres    false    5    903    906            �            1259    119363    BetParticipant3    TABLE       CREATE TABLE public."BetParticipant3" (
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
       public         heap r       postgres    false    906    903    5            �            1259    119362    BetParticipant3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipant3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."BetParticipant3_id_seq";
       public               postgres    false    5    250            �           0    0    BetParticipant3_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."BetParticipant3_id_seq" OWNED BY public."BetParticipant3".id;
          public               postgres    false    249                       1259    119401    BetParticipant4    TABLE       CREATE TABLE public."BetParticipant4" (
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
       public         heap r       postgres    false    5    906    903                       1259    119400    BetParticipant4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipant4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public."BetParticipant4_id_seq";
       public               postgres    false    258    5            �           0    0    BetParticipant4_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public."BetParticipant4_id_seq" OWNED BY public."BetParticipant4".id;
          public               postgres    false    257            �            1259    119274    BetParticipantCLOSED    TABLE     H  CREATE TABLE public."BetParticipantCLOSED" (
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
       public         heap r       postgres    false    903    5    906            �            1259    119382    BetParticipantCLOSED3    TABLE     J  CREATE TABLE public."BetParticipantCLOSED3" (
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
       public         heap r       postgres    false    906    5    903            �            1259    119381    BetParticipantCLOSED3_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipantCLOSED3_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public."BetParticipantCLOSED3_id_seq";
       public               postgres    false    254    5            �           0    0    BetParticipantCLOSED3_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public."BetParticipantCLOSED3_id_seq" OWNED BY public."BetParticipantCLOSED3".id;
          public               postgres    false    253                       1259    119420    BetParticipantCLOSED4    TABLE     J  CREATE TABLE public."BetParticipantCLOSED4" (
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
       public         heap r       postgres    false    903    5    906                       1259    119419    BetParticipantCLOSED4_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipantCLOSED4_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public."BetParticipantCLOSED4_id_seq";
       public               postgres    false    5    262            �           0    0    BetParticipantCLOSED4_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public."BetParticipantCLOSED4_id_seq" OWNED BY public."BetParticipantCLOSED4".id;
          public               postgres    false    261            �            1259    119273    BetParticipantCLOSED_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipantCLOSED_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public."BetParticipantCLOSED_id_seq";
       public               postgres    false    232    5            �           0    0    BetParticipantCLOSED_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public."BetParticipantCLOSED_id_seq" OWNED BY public."BetParticipantCLOSED".id;
          public               postgres    false    231            �            1259    119253    BetParticipant_id_seq    SEQUENCE     �   CREATE SEQUENCE public."BetParticipant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public."BetParticipant_id_seq";
       public               postgres    false    228    5            �           0    0    BetParticipant_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public."BetParticipant_id_seq" OWNED BY public."BetParticipant".id;
          public               postgres    false    227            �            1259    119243 
   Bet_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Bet_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public."Bet_id_seq";
       public               postgres    false    5    226            �           0    0 
   Bet_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public."Bet_id_seq" OWNED BY public."Bet".id;
          public               postgres    false    225            �            1259    119326    Category    TABLE     T   CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL
);
    DROP TABLE public."Category";
       public         heap r       postgres    false    5            �            1259    119325    Category_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."Category_id_seq";
       public               postgres    false    5    242            �           0    0    Category_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;
          public               postgres    false    241            �            1259    119234 	   ChatUsers    TABLE     
  CREATE TABLE public."ChatUsers" (
    id integer NOT NULL,
    "chatUserId" integer NOT NULL,
    "chatText" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."ChatUsers";
       public         heap r       postgres    false    5            �            1259    119233    ChatUsers_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ChatUsers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public."ChatUsers_id_seq";
       public               postgres    false    5    224            �           0    0    ChatUsers_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public."ChatUsers_id_seq" OWNED BY public."ChatUsers".id;
          public               postgres    false    223            �            1259    119291 
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
       public         heap r       postgres    false    5            �            1259    119290    GlobalData_id_seq    SEQUENCE     �   CREATE SEQUENCE public."GlobalData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."GlobalData_id_seq";
       public               postgres    false    5    236            �           0    0    GlobalData_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."GlobalData_id_seq" OWNED BY public."GlobalData".id;
          public               postgres    false    235            �            1259    119214    OrderP2P    TABLE     �  CREATE TABLE public."OrderP2P" (
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
       public         heap r       postgres    false    900    5    900    897            �            1259    119213    OrderP2P_id_seq    SEQUENCE     �   CREATE SEQUENCE public."OrderP2P_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."OrderP2P_id_seq";
       public               postgres    false    5    220            �           0    0    OrderP2P_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."OrderP2P_id_seq" OWNED BY public."OrderP2P".id;
          public               postgres    false    219            �            1259    119317    Player    TABLE     R   CREATE TABLE public."Player" (
    id integer NOT NULL,
    name text NOT NULL
);
    DROP TABLE public."Player";
       public         heap r       postgres    false    5            �            1259    119316    Player_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Player_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public."Player_id_seq";
       public               postgres    false    240    5            �           0    0    Player_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public."Player_id_seq" OWNED BY public."Player".id;
          public               postgres    false    239            �            1259    119335    Product    TABLE     v   CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer NOT NULL
);
    DROP TABLE public."Product";
       public         heap r       postgres    false    5            �            1259    119344    ProductItem    TABLE     y   CREATE TABLE public."ProductItem" (
    id integer NOT NULL,
    name text NOT NULL,
    "productId" integer NOT NULL
);
 !   DROP TABLE public."ProductItem";
       public         heap r       postgres    false    5            �            1259    119343    ProductItem_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ProductItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public."ProductItem_id_seq";
       public               postgres    false    5    246            �           0    0    ProductItem_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public."ProductItem_id_seq" OWNED BY public."ProductItem".id;
          public               postgres    false    245            �            1259    119334    Product_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public."Product_id_seq";
       public               postgres    false    5    244            �           0    0    Product_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;
          public               postgres    false    243            �            1259    119305    ReferralUserIpAddress    TABLE     �  CREATE TABLE public."ReferralUserIpAddress" (
    id integer NOT NULL,
    "referralUserId" integer NOT NULL,
    "referralIpAddress" text NOT NULL,
    "referralStatus" boolean DEFAULT false NOT NULL,
    "referralPoints" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 +   DROP TABLE public."ReferralUserIpAddress";
       public         heap r       postgres    false    5            �            1259    119304    ReferralUserIpAddress_id_seq    SEQUENCE     �   CREATE SEQUENCE public."ReferralUserIpAddress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public."ReferralUserIpAddress_id_seq";
       public               postgres    false    5    238            �           0    0    ReferralUserIpAddress_id_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public."ReferralUserIpAddress_id_seq" OWNED BY public."ReferralUserIpAddress".id;
          public               postgres    false    237            �            1259    119226    Transfer    TABLE     ]  CREATE TABLE public."Transfer" (
    id integer NOT NULL,
    "transferUser1Id" integer NOT NULL,
    "transferUser2Id" integer,
    "transferPoints" double precision NOT NULL,
    "transferStatus" boolean,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."Transfer";
       public         heap r       postgres    false    5            �            1259    119225    Transfer_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Transfer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."Transfer_id_seq";
       public               postgres    false    222    5            �           0    0    Transfer_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."Transfer_id_seq" OWNED BY public."Transfer".id;
          public               postgres    false    221            �            1259    119199    User    TABLE     �  CREATE TABLE public."User" (
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
       public         heap r       postgres    false    894    894    5            �            1259    119198    User_id_seq    SEQUENCE     �   CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."User_id_seq";
       public               postgres    false    5    218            �           0    0    User_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;
          public               postgres    false    217            �            1259    119283 	   regPoints    TABLE     "  CREATE TABLE public."regPoints" (
    id integer NOT NULL,
    "regPointsUserId" integer NOT NULL,
    "regPointsPoints" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."regPoints";
       public         heap r       postgres    false    5            �            1259    119282    regPoints_id_seq    SEQUENCE     �   CREATE SEQUENCE public."regPoints_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public."regPoints_id_seq";
       public               postgres    false    234    5            �           0    0    regPoints_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public."regPoints_id_seq" OWNED BY public."regPoints".id;
          public               postgres    false    233                       2604    119247    Bet id    DEFAULT     d   ALTER TABLE ONLY public."Bet" ALTER COLUMN id SET DEFAULT nextval('public."Bet_id_seq"'::regclass);
 7   ALTER TABLE public."Bet" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225    226            6           2604    119356    Bet3 id    DEFAULT     f   ALTER TABLE ONLY public."Bet3" ALTER COLUMN id SET DEFAULT nextval('public."Bet3_id_seq"'::regclass);
 8   ALTER TABLE public."Bet3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    247    248    248            D           2604    119394    Bet4 id    DEFAULT     f   ALTER TABLE ONLY public."Bet4" ALTER COLUMN id SET DEFAULT nextval('public."Bet4_id_seq"'::regclass);
 8   ALTER TABLE public."Bet4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    256    255    256                       2604    119266    BetCLOSED id    DEFAULT     p   ALTER TABLE ONLY public."BetCLOSED" ALTER COLUMN id SET DEFAULT nextval('public."BetCLOSED_id_seq"'::regclass);
 =   ALTER TABLE public."BetCLOSED" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    230    229    230            =           2604    119375    BetCLOSED3 id    DEFAULT     r   ALTER TABLE ONLY public."BetCLOSED3" ALTER COLUMN id SET DEFAULT nextval('public."BetCLOSED3_id_seq"'::regclass);
 >   ALTER TABLE public."BetCLOSED3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    252    251    252            K           2604    119413    BetCLOSED4 id    DEFAULT     r   ALTER TABLE ONLY public."BetCLOSED4" ALTER COLUMN id SET DEFAULT nextval('public."BetCLOSED4_id_seq"'::regclass);
 >   ALTER TABLE public."BetCLOSED4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    260    259    260                       2604    119257    BetParticipant id    DEFAULT     z   ALTER TABLE ONLY public."BetParticipant" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipant_id_seq"'::regclass);
 B   ALTER TABLE public."BetParticipant" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    227    228    228            :           2604    119366    BetParticipant3 id    DEFAULT     |   ALTER TABLE ONLY public."BetParticipant3" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipant3_id_seq"'::regclass);
 C   ALTER TABLE public."BetParticipant3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    250    249    250            H           2604    119404    BetParticipant4 id    DEFAULT     |   ALTER TABLE ONLY public."BetParticipant4" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipant4_id_seq"'::regclass);
 C   ALTER TABLE public."BetParticipant4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    258    257    258            !           2604    119277    BetParticipantCLOSED id    DEFAULT     �   ALTER TABLE ONLY public."BetParticipantCLOSED" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipantCLOSED_id_seq"'::regclass);
 H   ALTER TABLE public."BetParticipantCLOSED" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231    232            A           2604    119385    BetParticipantCLOSED3 id    DEFAULT     �   ALTER TABLE ONLY public."BetParticipantCLOSED3" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipantCLOSED3_id_seq"'::regclass);
 I   ALTER TABLE public."BetParticipantCLOSED3" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    253    254    254            O           2604    119423    BetParticipantCLOSED4 id    DEFAULT     �   ALTER TABLE ONLY public."BetParticipantCLOSED4" ALTER COLUMN id SET DEFAULT nextval('public."BetParticipantCLOSED4_id_seq"'::regclass);
 I   ALTER TABLE public."BetParticipantCLOSED4" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    262    261    262            3           2604    119329    Category id    DEFAULT     n   ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);
 <   ALTER TABLE public."Category" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    241    242    242                       2604    119237    ChatUsers id    DEFAULT     p   ALTER TABLE ONLY public."ChatUsers" ALTER COLUMN id SET DEFAULT nextval('public."ChatUsers_id_seq"'::regclass);
 =   ALTER TABLE public."ChatUsers" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    223    224    224            &           2604    119294    GlobalData id    DEFAULT     r   ALTER TABLE ONLY public."GlobalData" ALTER COLUMN id SET DEFAULT nextval('public."GlobalData_id_seq"'::regclass);
 >   ALTER TABLE public."GlobalData" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    235    236    236                       2604    119217    OrderP2P id    DEFAULT     n   ALTER TABLE ONLY public."OrderP2P" ALTER COLUMN id SET DEFAULT nextval('public."OrderP2P_id_seq"'::regclass);
 <   ALTER TABLE public."OrderP2P" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    220    219    220            2           2604    119320 	   Player id    DEFAULT     j   ALTER TABLE ONLY public."Player" ALTER COLUMN id SET DEFAULT nextval('public."Player_id_seq"'::regclass);
 :   ALTER TABLE public."Player" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    239    240    240            4           2604    119338 
   Product id    DEFAULT     l   ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);
 ;   ALTER TABLE public."Product" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    243    244    244            5           2604    119347    ProductItem id    DEFAULT     t   ALTER TABLE ONLY public."ProductItem" ALTER COLUMN id SET DEFAULT nextval('public."ProductItem_id_seq"'::regclass);
 ?   ALTER TABLE public."ProductItem" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    245    246    246            .           2604    119308    ReferralUserIpAddress id    DEFAULT     �   ALTER TABLE ONLY public."ReferralUserIpAddress" ALTER COLUMN id SET DEFAULT nextval('public."ReferralUserIpAddress_id_seq"'::regclass);
 I   ALTER TABLE public."ReferralUserIpAddress" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    238    237    238                       2604    119229    Transfer id    DEFAULT     n   ALTER TABLE ONLY public."Transfer" ALTER COLUMN id SET DEFAULT nextval('public."Transfer_id_seq"'::regclass);
 <   ALTER TABLE public."Transfer" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222                       2604    119202    User id    DEFAULT     f   ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);
 8   ALTER TABLE public."User" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    217    218    218            $           2604    119286    regPoints id    DEFAULT     p   ALTER TABLE ONLY public."regPoints" ALTER COLUMN id SET DEFAULT nextval('public."regPoints_id_seq"'::regclass);
 =   ALTER TABLE public."regPoints" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    234    233    234            `          0    119244    Bet 
   TABLE DATA           r  COPY public."Bet" (id, "player1Id", "player2Id", "initBetPlayer1", "initBetPlayer2", "totalBetPlayer1", "totalBetPlayer2", "oddsBetPlayer1", "oddsBetPlayer2", "maxBetPlayer1", "maxBetPlayer2", "overlapPlayer1", "overlapPlayer2", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    226   ~t      v          0    119353    Bet3 
   TABLE DATA           �  COPY public."Bet3" (id, "player1Id", "player2Id", "player3Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    248   �t      ~          0    119391    Bet4 
   TABLE DATA           A  COPY public."Bet4" (id, "player1Id", "player2Id", "player3Id", "player4Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "initBetPlayer4", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "totalBetPlayer4", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "oddsBetPlayer4", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "maxBetPlayer4", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "overlapPlayer4", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    256   u      d          0    119263 	   BetCLOSED 
   TABLE DATA           �  COPY public."BetCLOSED" (id, "player1Id", "player2Id", "initBetPlayer1", "initBetPlayer2", "totalBetPlayer1", "totalBetPlayer2", "oddsBetPlayer1", "oddsBetPlayer2", "maxBetPlayer1", "maxBetPlayer2", "overlapPlayer1", "overlapPlayer2", "totalBetAmount", "returnBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    230   3u      z          0    119372 
   BetCLOSED3 
   TABLE DATA           �  COPY public."BetCLOSED3" (id, "player1Id", "player2Id", "player3Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    252   Pu      �          0    119410 
   BetCLOSED4 
   TABLE DATA           G  COPY public."BetCLOSED4" (id, "player1Id", "player2Id", "player3Id", "player4Id", "initBetPlayer1", "initBetPlayer2", "initBetPlayer3", "initBetPlayer4", "totalBetPlayer1", "totalBetPlayer2", "totalBetPlayer3", "totalBetPlayer4", "oddsBetPlayer1", "oddsBetPlayer2", "oddsBetPlayer3", "oddsBetPlayer4", "maxBetPlayer1", "maxBetPlayer2", "maxBetPlayer3", "maxBetPlayer4", "overlapPlayer1", "overlapPlayer2", "overlapPlayer3", "overlapPlayer4", "totalBetAmount", "creatorId", status, "categoryId", "productId", "productItemId", "winnerId", margin, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    260   mu      b          0    119254    BetParticipant 
   TABLE DATA           �   COPY public."BetParticipant" (id, "betId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", "isWinner", "createdAt") FROM stdin;
    public               postgres    false    228   �u      x          0    119363    BetParticipant3 
   TABLE DATA           �   COPY public."BetParticipant3" (id, "betId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", "isWinner", "createdAt") FROM stdin;
    public               postgres    false    250   /v      �          0    119401    BetParticipant4 
   TABLE DATA           �   COPY public."BetParticipant4" (id, "betId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", "isWinner", "createdAt") FROM stdin;
    public               postgres    false    258   Lv      f          0    119274    BetParticipantCLOSED 
   TABLE DATA           �   COPY public."BetParticipantCLOSED" (id, "betCLOSEDId", "userId", player, amount, odds, profit, overlap, margin, "isCovered", return, "isWinner", "createdAt") FROM stdin;
    public               postgres    false    232   iv      |          0    119382    BetParticipantCLOSED3 
   TABLE DATA           �   COPY public."BetParticipantCLOSED3" (id, "betCLOSED3Id", "userId", player, amount, odds, profit, overlap, margin, "isCovered", return, "isWinner", "createdAt") FROM stdin;
    public               postgres    false    254   �v      �          0    119420    BetParticipantCLOSED4 
   TABLE DATA           �   COPY public."BetParticipantCLOSED4" (id, "betCLOSED4Id", "userId", player, amount, odds, profit, overlap, margin, "isCovered", return, "isWinner", "createdAt") FROM stdin;
    public               postgres    false    262   �v      p          0    119326    Category 
   TABLE DATA           .   COPY public."Category" (id, name) FROM stdin;
    public               postgres    false    242   �v      ^          0    119234 	   ChatUsers 
   TABLE DATA           ]   COPY public."ChatUsers" (id, "chatUserId", "chatText", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    224   �v      j          0    119291 
   GlobalData 
   TABLE DATA           ~   COPY public."GlobalData" (id, users, reg, ref, "usersPoints", margin, "openBetsPoints", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    236   w      Z          0    119214    OrderP2P 
   TABLE DATA             COPY public."OrderP2P" (id, "orderP2PUser1Id", "orderP2PUser2Id", "orderP2PBuySell", "orderP2PPoints", "orderP2PPrice", "orderP2PPart", "orderBankDetails", "orderP2PStatus", "orderP2PCheckUser1", "orderP2PCheckUser2", "orderBankPay", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    220   Ww      n          0    119317    Player 
   TABLE DATA           ,   COPY public."Player" (id, name) FROM stdin;
    public               postgres    false    240   tw      r          0    119335    Product 
   TABLE DATA           ;   COPY public."Product" (id, name, "categoryId") FROM stdin;
    public               postgres    false    244   y      t          0    119344    ProductItem 
   TABLE DATA           >   COPY public."ProductItem" (id, name, "productId") FROM stdin;
    public               postgres    false    246   >y      l          0    119305    ReferralUserIpAddress 
   TABLE DATA           �   COPY public."ReferralUserIpAddress" (id, "referralUserId", "referralIpAddress", "referralStatus", "referralPoints", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    238   by      \          0    119226    Transfer 
   TABLE DATA           �   COPY public."Transfer" (id, "transferUser1Id", "transferUser2Id", "transferPoints", "transferStatus", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    222   y      X          0    119199    User 
   TABLE DATA           �   COPY public."User" (id, email, "cardId", "fullName", provider, "providerId", password, role, img, points, "p2pPlus", "p2pMinus", contact, "loginHistory", "bankDetails", telegram, "telegramView", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    218   �y      h          0    119283 	   regPoints 
   TABLE DATA           i   COPY public."regPoints" (id, "regPointsUserId", "regPointsPoints", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    234   �~      �           0    0    Bet3_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public."Bet3_id_seq"', 1, false);
          public               postgres    false    247            �           0    0    Bet4_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public."Bet4_id_seq"', 1, false);
          public               postgres    false    255            �           0    0    BetCLOSED3_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public."BetCLOSED3_id_seq"', 1, false);
          public               postgres    false    251            �           0    0    BetCLOSED4_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public."BetCLOSED4_id_seq"', 1, false);
          public               postgres    false    259            �           0    0    BetCLOSED_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."BetCLOSED_id_seq"', 1, false);
          public               postgres    false    229            �           0    0    BetParticipant3_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public."BetParticipant3_id_seq"', 1, false);
          public               postgres    false    249            �           0    0    BetParticipant4_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public."BetParticipant4_id_seq"', 1, false);
          public               postgres    false    257            �           0    0    BetParticipantCLOSED3_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public."BetParticipantCLOSED3_id_seq"', 1, false);
          public               postgres    false    253            �           0    0    BetParticipantCLOSED4_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public."BetParticipantCLOSED4_id_seq"', 1, false);
          public               postgres    false    261            �           0    0    BetParticipantCLOSED_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public."BetParticipantCLOSED_id_seq"', 1, false);
          public               postgres    false    231            �           0    0    BetParticipant_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public."BetParticipant_id_seq"', 4, true);
          public               postgres    false    227            �           0    0 
   Bet_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public."Bet_id_seq"', 2, true);
          public               postgres    false    225            �           0    0    Category_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."Category_id_seq"', 1, true);
          public               postgres    false    241            �           0    0    ChatUsers_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."ChatUsers_id_seq"', 1, false);
          public               postgres    false    223            �           0    0    GlobalData_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."GlobalData_id_seq"', 1, true);
          public               postgres    false    235            �           0    0    OrderP2P_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public."OrderP2P_id_seq"', 1, false);
          public               postgres    false    219            �           0    0    Player_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public."Player_id_seq"', 1, false);
          public               postgres    false    239            �           0    0    ProductItem_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public."ProductItem_id_seq"', 1, false);
          public               postgres    false    245            �           0    0    Product_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."Product_id_seq"', 1, false);
          public               postgres    false    243            �           0    0    ReferralUserIpAddress_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public."ReferralUserIpAddress_id_seq"', 1, false);
          public               postgres    false    237            �           0    0    Transfer_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public."Transfer_id_seq"', 1, false);
          public               postgres    false    221            �           0    0    User_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public."User_id_seq"', 5, true);
          public               postgres    false    217            �           0    0    regPoints_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."regPoints_id_seq"', 1, false);
          public               postgres    false    233            x           2606    119361    Bet3 Bet3_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_pkey";
       public                 postgres    false    248            �           2606    119399    Bet4 Bet4_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_pkey";
       public                 postgres    false    256            |           2606    119380    BetCLOSED3 BetCLOSED3_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_pkey";
       public                 postgres    false    252            �           2606    119418    BetCLOSED4 BetCLOSED4_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_pkey";
       public                 postgres    false    260            b           2606    119272    BetCLOSED BetCLOSED_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_pkey";
       public                 postgres    false    230            z           2606    119370 $   BetParticipant3 BetParticipant3_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public."BetParticipant3"
    ADD CONSTRAINT "BetParticipant3_pkey" PRIMARY KEY (id);
 R   ALTER TABLE ONLY public."BetParticipant3" DROP CONSTRAINT "BetParticipant3_pkey";
       public                 postgres    false    250            �           2606    119408 $   BetParticipant4 BetParticipant4_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public."BetParticipant4"
    ADD CONSTRAINT "BetParticipant4_pkey" PRIMARY KEY (id);
 R   ALTER TABLE ONLY public."BetParticipant4" DROP CONSTRAINT "BetParticipant4_pkey";
       public                 postgres    false    258            ~           2606    119389 0   BetParticipantCLOSED3 BetParticipantCLOSED3_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public."BetParticipantCLOSED3"
    ADD CONSTRAINT "BetParticipantCLOSED3_pkey" PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public."BetParticipantCLOSED3" DROP CONSTRAINT "BetParticipantCLOSED3_pkey";
       public                 postgres    false    254            �           2606    119427 0   BetParticipantCLOSED4 BetParticipantCLOSED4_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public."BetParticipantCLOSED4"
    ADD CONSTRAINT "BetParticipantCLOSED4_pkey" PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public."BetParticipantCLOSED4" DROP CONSTRAINT "BetParticipantCLOSED4_pkey";
       public                 postgres    false    262            d           2606    119281 .   BetParticipantCLOSED BetParticipantCLOSED_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_pkey" PRIMARY KEY (id);
 \   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_pkey";
       public                 postgres    false    232            `           2606    119261 "   BetParticipant BetParticipant_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_pkey" PRIMARY KEY (id);
 P   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_pkey";
       public                 postgres    false    228            ^           2606    119252    Bet Bet_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_pkey" PRIMARY KEY (id);
 :   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_pkey";
       public                 postgres    false    226            p           2606    119333    Category Category_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Category" DROP CONSTRAINT "Category_pkey";
       public                 postgres    false    242            \           2606    119242    ChatUsers ChatUsers_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."ChatUsers"
    ADD CONSTRAINT "ChatUsers_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."ChatUsers" DROP CONSTRAINT "ChatUsers_pkey";
       public                 postgres    false    224            h           2606    119303    GlobalData GlobalData_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."GlobalData"
    ADD CONSTRAINT "GlobalData_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."GlobalData" DROP CONSTRAINT "GlobalData_pkey";
       public                 postgres    false    236            X           2606    119224    OrderP2P OrderP2P_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."OrderP2P"
    ADD CONSTRAINT "OrderP2P_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."OrderP2P" DROP CONSTRAINT "OrderP2P_pkey";
       public                 postgres    false    220            m           2606    119324    Player Player_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public."Player"
    ADD CONSTRAINT "Player_pkey" PRIMARY KEY (id);
 @   ALTER TABLE ONLY public."Player" DROP CONSTRAINT "Player_pkey";
       public                 postgres    false    240            v           2606    119351    ProductItem ProductItem_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."ProductItem"
    ADD CONSTRAINT "ProductItem_pkey" PRIMARY KEY (id);
 J   ALTER TABLE ONLY public."ProductItem" DROP CONSTRAINT "ProductItem_pkey";
       public                 postgres    false    246            s           2606    119342    Product Product_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);
 B   ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_pkey";
       public                 postgres    false    244            j           2606    119315 0   ReferralUserIpAddress ReferralUserIpAddress_pkey 
   CONSTRAINT     r   ALTER TABLE ONLY public."ReferralUserIpAddress"
    ADD CONSTRAINT "ReferralUserIpAddress_pkey" PRIMARY KEY (id);
 ^   ALTER TABLE ONLY public."ReferralUserIpAddress" DROP CONSTRAINT "ReferralUserIpAddress_pkey";
       public                 postgres    false    238            Z           2606    119232    Transfer Transfer_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Transfer" DROP CONSTRAINT "Transfer_pkey";
       public                 postgres    false    222            U           2606    119212    User User_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
       public                 postgres    false    218            f           2606    119289    regPoints regPoints_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."regPoints"
    ADD CONSTRAINT "regPoints_pkey" PRIMARY KEY (id);
 F   ALTER TABLE ONLY public."regPoints" DROP CONSTRAINT "regPoints_pkey";
       public                 postgres    false    234            n           1259    119432    Category_name_key    INDEX     Q   CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);
 '   DROP INDEX public."Category_name_key";
       public                 postgres    false    242            k           1259    119431    Player_name_key    INDEX     M   CREATE UNIQUE INDEX "Player_name_key" ON public."Player" USING btree (name);
 %   DROP INDEX public."Player_name_key";
       public                 postgres    false    240            t           1259    119434    ProductItem_name_key    INDEX     W   CREATE UNIQUE INDEX "ProductItem_name_key" ON public."ProductItem" USING btree (name);
 *   DROP INDEX public."ProductItem_name_key";
       public                 postgres    false    246            q           1259    119433    Product_name_key    INDEX     O   CREATE UNIQUE INDEX "Product_name_key" ON public."Product" USING btree (name);
 &   DROP INDEX public."Product_name_key";
       public                 postgres    false    244            R           1259    119429    User_cardId_key    INDEX     O   CREATE UNIQUE INDEX "User_cardId_key" ON public."User" USING btree ("cardId");
 %   DROP INDEX public."User_cardId_key";
       public                 postgres    false    218            S           1259    119428    User_email_key    INDEX     K   CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);
 $   DROP INDEX public."User_email_key";
       public                 postgres    false    218            V           1259    119430    User_telegram_key    INDEX     Q   CREATE UNIQUE INDEX "User_telegram_key" ON public."User" USING btree (telegram);
 '   DROP INDEX public."User_telegram_key";
       public                 postgres    false    218            �           2606    119580    Bet3 Bet3_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 G   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_categoryId_fkey";
       public               postgres    false    248    4976    242            �           2606    119575    Bet3 Bet3_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_creatorId_fkey";
       public               postgres    false    248    4949    218            �           2606    119560    Bet3 Bet3_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_player1Id_fkey";
       public               postgres    false    240    4973    248            �           2606    119565    Bet3 Bet3_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_player2Id_fkey";
       public               postgres    false    4973    240    248            �           2606    119570    Bet3 Bet3_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_player3Id_fkey";
       public               postgres    false    4973    248    240            �           2606    119585    Bet3 Bet3_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 F   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_productId_fkey";
       public               postgres    false    248    4979    244            �           2606    119590    Bet3 Bet3_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet3"
    ADD CONSTRAINT "Bet3_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 J   ALTER TABLE ONLY public."Bet3" DROP CONSTRAINT "Bet3_productItemId_fkey";
       public               postgres    false    248    4982    246            �           2606    119675    Bet4 Bet4_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 G   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_categoryId_fkey";
       public               postgres    false    256    242    4976            �           2606    119670    Bet4 Bet4_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_creatorId_fkey";
       public               postgres    false    218    256    4949            �           2606    119650    Bet4 Bet4_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player1Id_fkey";
       public               postgres    false    256    4973    240            �           2606    119655    Bet4 Bet4_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player2Id_fkey";
       public               postgres    false    256    4973    240            �           2606    119660    Bet4 Bet4_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player3Id_fkey";
       public               postgres    false    256    4973    240            �           2606    119665    Bet4 Bet4_player4Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_player4Id_fkey";
       public               postgres    false    256    240    4973            �           2606    119680    Bet4 Bet4_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 F   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_productId_fkey";
       public               postgres    false    256    4979    244            �           2606    119685    Bet4 Bet4_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet4"
    ADD CONSTRAINT "Bet4_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 J   ALTER TABLE ONLY public."Bet4" DROP CONSTRAINT "Bet4_productItemId_fkey";
       public               postgres    false    246    4982    256            �           2606    119625 %   BetCLOSED3 BetCLOSED3_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 S   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_categoryId_fkey";
       public               postgres    false    252    4976    242            �           2606    119620 $   BetCLOSED3 BetCLOSED3_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_creatorId_fkey";
       public               postgres    false    252    4949    218            �           2606    119605 $   BetCLOSED3 BetCLOSED3_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_player1Id_fkey";
       public               postgres    false    252    4973    240            �           2606    119610 $   BetCLOSED3 BetCLOSED3_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_player2Id_fkey";
       public               postgres    false    252    4973    240            �           2606    119615 $   BetCLOSED3 BetCLOSED3_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_player3Id_fkey";
       public               postgres    false    252    4973    240            �           2606    119630 $   BetCLOSED3 BetCLOSED3_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 R   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_productId_fkey";
       public               postgres    false    252    4979    244            �           2606    119635 (   BetCLOSED3 BetCLOSED3_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED3"
    ADD CONSTRAINT "BetCLOSED3_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 V   ALTER TABLE ONLY public."BetCLOSED3" DROP CONSTRAINT "BetCLOSED3_productItemId_fkey";
       public               postgres    false    252    4982    246            �           2606    119725 %   BetCLOSED4 BetCLOSED4_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 S   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_categoryId_fkey";
       public               postgres    false    260    242    4976            �           2606    119720 $   BetCLOSED4 BetCLOSED4_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_creatorId_fkey";
       public               postgres    false    260    218    4949            �           2606    119700 $   BetCLOSED4 BetCLOSED4_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player1Id_fkey";
       public               postgres    false    4973    260    240            �           2606    119705 $   BetCLOSED4 BetCLOSED4_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player2Id_fkey";
       public               postgres    false    4973    260    240            �           2606    119710 $   BetCLOSED4 BetCLOSED4_player3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player3Id_fkey";
       public               postgres    false    260    240    4973            �           2606    119715 $   BetCLOSED4 BetCLOSED4_player4Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_player4Id_fkey";
       public               postgres    false    4973    240    260            �           2606    119730 $   BetCLOSED4 BetCLOSED4_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 R   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_productId_fkey";
       public               postgres    false    260    244    4979            �           2606    119735 (   BetCLOSED4 BetCLOSED4_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED4"
    ADD CONSTRAINT "BetCLOSED4_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 V   ALTER TABLE ONLY public."BetCLOSED4" DROP CONSTRAINT "BetCLOSED4_productItemId_fkey";
       public               postgres    false    260    4982    246            �           2606    119515 #   BetCLOSED BetCLOSED_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 Q   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_categoryId_fkey";
       public               postgres    false    242    4976    230            �           2606    119510 "   BetCLOSED BetCLOSED_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_creatorId_fkey";
       public               postgres    false    230    218    4949            �           2606    119500 "   BetCLOSED BetCLOSED_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_player1Id_fkey";
       public               postgres    false    240    230    4973            �           2606    119505 "   BetCLOSED BetCLOSED_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_player2Id_fkey";
       public               postgres    false    4973    240    230            �           2606    119520 "   BetCLOSED BetCLOSED_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 P   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_productId_fkey";
       public               postgres    false    4979    244    230            �           2606    119525 &   BetCLOSED BetCLOSED_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetCLOSED"
    ADD CONSTRAINT "BetCLOSED_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 T   ALTER TABLE ONLY public."BetCLOSED" DROP CONSTRAINT "BetCLOSED_productItemId_fkey";
       public               postgres    false    246    4982    230            �           2606    119595 *   BetParticipant3 BetParticipant3_betId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant3"
    ADD CONSTRAINT "BetParticipant3_betId_fkey" FOREIGN KEY ("betId") REFERENCES public."Bet3"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 X   ALTER TABLE ONLY public."BetParticipant3" DROP CONSTRAINT "BetParticipant3_betId_fkey";
       public               postgres    false    250    4984    248            �           2606    119600 +   BetParticipant3 BetParticipant3_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant3"
    ADD CONSTRAINT "BetParticipant3_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Y   ALTER TABLE ONLY public."BetParticipant3" DROP CONSTRAINT "BetParticipant3_userId_fkey";
       public               postgres    false    250    4949    218            �           2606    119690 *   BetParticipant4 BetParticipant4_betId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant4"
    ADD CONSTRAINT "BetParticipant4_betId_fkey" FOREIGN KEY ("betId") REFERENCES public."Bet4"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 X   ALTER TABLE ONLY public."BetParticipant4" DROP CONSTRAINT "BetParticipant4_betId_fkey";
       public               postgres    false    256    258    4992            �           2606    119695 +   BetParticipant4 BetParticipant4_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant4"
    ADD CONSTRAINT "BetParticipant4_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Y   ALTER TABLE ONLY public."BetParticipant4" DROP CONSTRAINT "BetParticipant4_userId_fkey";
       public               postgres    false    218    4949    258            �           2606    119640 =   BetParticipantCLOSED3 BetParticipantCLOSED3_betCLOSED3Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED3"
    ADD CONSTRAINT "BetParticipantCLOSED3_betCLOSED3Id_fkey" FOREIGN KEY ("betCLOSED3Id") REFERENCES public."BetCLOSED3"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 k   ALTER TABLE ONLY public."BetParticipantCLOSED3" DROP CONSTRAINT "BetParticipantCLOSED3_betCLOSED3Id_fkey";
       public               postgres    false    254    4988    252            �           2606    119645 7   BetParticipantCLOSED3 BetParticipantCLOSED3_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED3"
    ADD CONSTRAINT "BetParticipantCLOSED3_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 e   ALTER TABLE ONLY public."BetParticipantCLOSED3" DROP CONSTRAINT "BetParticipantCLOSED3_userId_fkey";
       public               postgres    false    254    4949    218            �           2606    119740 =   BetParticipantCLOSED4 BetParticipantCLOSED4_betCLOSED4Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED4"
    ADD CONSTRAINT "BetParticipantCLOSED4_betCLOSED4Id_fkey" FOREIGN KEY ("betCLOSED4Id") REFERENCES public."BetCLOSED4"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 k   ALTER TABLE ONLY public."BetParticipantCLOSED4" DROP CONSTRAINT "BetParticipantCLOSED4_betCLOSED4Id_fkey";
       public               postgres    false    262    260    4996            �           2606    119745 7   BetParticipantCLOSED4 BetParticipantCLOSED4_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED4"
    ADD CONSTRAINT "BetParticipantCLOSED4_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 e   ALTER TABLE ONLY public."BetParticipantCLOSED4" DROP CONSTRAINT "BetParticipantCLOSED4_userId_fkey";
       public               postgres    false    262    218    4949            �           2606    119530 :   BetParticipantCLOSED BetParticipantCLOSED_betCLOSEDId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_betCLOSEDId_fkey" FOREIGN KEY ("betCLOSEDId") REFERENCES public."BetCLOSED"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 h   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_betCLOSEDId_fkey";
       public               postgres    false    4962    230    232            �           2606    119535 5   BetParticipantCLOSED BetParticipantCLOSED_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipantCLOSED"
    ADD CONSTRAINT "BetParticipantCLOSED_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 c   ALTER TABLE ONLY public."BetParticipantCLOSED" DROP CONSTRAINT "BetParticipantCLOSED_userId_fkey";
       public               postgres    false    218    4949    232            �           2606    119490 (   BetParticipant BetParticipant_betId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_betId_fkey" FOREIGN KEY ("betId") REFERENCES public."Bet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 V   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_betId_fkey";
       public               postgres    false    4958    226    228            �           2606    119495 )   BetParticipant BetParticipant_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."BetParticipant"
    ADD CONSTRAINT "BetParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 W   ALTER TABLE ONLY public."BetParticipant" DROP CONSTRAINT "BetParticipant_userId_fkey";
       public               postgres    false    4949    218    228            �           2606    119475    Bet Bet_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 E   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_categoryId_fkey";
       public               postgres    false    4976    242    226            �           2606    119470    Bet Bet_creatorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_creatorId_fkey";
       public               postgres    false    218    226    4949            �           2606    119460    Bet Bet_player1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_player1Id_fkey";
       public               postgres    false    4973    226    240            �           2606    119465    Bet Bet_player2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_player2Id_fkey";
       public               postgres    false    4973    226    240            �           2606    119480    Bet Bet_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 D   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_productId_fkey";
       public               postgres    false    244    226    4979            �           2606    119485    Bet Bet_productItemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Bet"
    ADD CONSTRAINT "Bet_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES public."ProductItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 H   ALTER TABLE ONLY public."Bet" DROP CONSTRAINT "Bet_productItemId_fkey";
       public               postgres    false    226    246    4982            �           2606    119455 #   ChatUsers ChatUsers_chatUserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ChatUsers"
    ADD CONSTRAINT "ChatUsers_chatUserId_fkey" FOREIGN KEY ("chatUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Q   ALTER TABLE ONLY public."ChatUsers" DROP CONSTRAINT "ChatUsers_chatUserId_fkey";
       public               postgres    false    224    4949    218            �           2606    119435 &   OrderP2P OrderP2P_orderP2PUser1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."OrderP2P"
    ADD CONSTRAINT "OrderP2P_orderP2PUser1Id_fkey" FOREIGN KEY ("orderP2PUser1Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 T   ALTER TABLE ONLY public."OrderP2P" DROP CONSTRAINT "OrderP2P_orderP2PUser1Id_fkey";
       public               postgres    false    4949    220    218            �           2606    119440 &   OrderP2P OrderP2P_orderP2PUser2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."OrderP2P"
    ADD CONSTRAINT "OrderP2P_orderP2PUser2Id_fkey" FOREIGN KEY ("orderP2PUser2Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 T   ALTER TABLE ONLY public."OrderP2P" DROP CONSTRAINT "OrderP2P_orderP2PUser2Id_fkey";
       public               postgres    false    4949    218    220            �           2606    119555 &   ProductItem ProductItem_productId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ProductItem"
    ADD CONSTRAINT "ProductItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 T   ALTER TABLE ONLY public."ProductItem" DROP CONSTRAINT "ProductItem_productId_fkey";
       public               postgres    false    4979    244    246            �           2606    119550    Product Product_categoryId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 M   ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_categoryId_fkey";
       public               postgres    false    244    242    4976            �           2606    119545 ?   ReferralUserIpAddress ReferralUserIpAddress_referralUserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ReferralUserIpAddress"
    ADD CONSTRAINT "ReferralUserIpAddress_referralUserId_fkey" FOREIGN KEY ("referralUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 m   ALTER TABLE ONLY public."ReferralUserIpAddress" DROP CONSTRAINT "ReferralUserIpAddress_referralUserId_fkey";
       public               postgres    false    218    4949    238            �           2606    119445 &   Transfer Transfer_transferUser1Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_transferUser1Id_fkey" FOREIGN KEY ("transferUser1Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 T   ALTER TABLE ONLY public."Transfer" DROP CONSTRAINT "Transfer_transferUser1Id_fkey";
       public               postgres    false    218    4949    222            �           2606    119450 &   Transfer Transfer_transferUser2Id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_transferUser2Id_fkey" FOREIGN KEY ("transferUser2Id") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 T   ALTER TABLE ONLY public."Transfer" DROP CONSTRAINT "Transfer_transferUser2Id_fkey";
       public               postgres    false    4949    222    218            �           2606    119540 (   regPoints regPoints_regPointsUserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."regPoints"
    ADD CONSTRAINT "regPoints_regPointsUserId_fkey" FOREIGN KEY ("regPointsUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 V   ALTER TABLE ONLY public."regPoints" DROP CONSTRAINT "regPoints_regPointsUserId_fkey";
       public               postgres    false    234    218    4949            `   k   x�����PD�P�6 a���{U��:���ML̐��<�ȵ�d?N�w?�m�ҹUC�'�	��o��ch{��n��$$A��q ��2��W@�X�?���S����#�      v      x������ � �      ~      x������ � �      d      x������ � �      z      x������ � �      �      x������ � �      b   �   x�}�M
�@���)�@C�I:?;���]	����� �P/���h�u>>�M@�A?�p���:����A�碱H�d��r���(��Er��	�,�����Wg��u�BA��
�2đ�AYj��.�e9�SR&N�OB�7h�3=      x      x������ � �      �      x������ � �      f      x������ � �      |      x������ � �      �      x������ � �      p      x�3��JM*-Vp.�/.����� 8      ^      x������ � �      j   ?   x�]ȱ�@��p��0��Z����d����{G0C��Xz�&`���{#J_S��Q�      Z      x������ � �      n   �  x���n�0E�3S���Z:ij�S�l�(@�-F"$�N�/�� w�s�e0�Q�N"���ѮG�iWn0���z߮q{�A9i?���q9냡�
�ێp��([�K(�D���\�i\A�{.��˺@��Q՟-逌�I����q�>8
A52�c��5�b��A����(�����+�:ds�#��g�^�=���Ȗp�{��������,�sy#���Z?r
:�s�2u�x���'�^7Y��A��Z�9�52fp�������r��%�X�G{p���k6�+�ؓQE�-W����4ʡ�P�VO2eD��9�����M�b;D���W'sت��M[��@,ଜ5�K8�{ZNwi�V����G�ܷ�<�s��x� �?�<��      r      x�3���4����� r�      t      x�3���4����� r�      l      x������ � �      \      x������ � �      X     x��[OGǟͧ�<$����x�w1����,���l�m�U$BR��>$jRU��TQ? iKE%�
㯐OҳK.8!��JM����zgv����3?���v������Be-^Z�Ƹf�rJ��1f��+b�3��-^"�����tv�m̋��DjE��tZ�˹�
M�ҵ\ ��H��ɽ|Y璉]���ٙd.�@ϱ�}��_��
���a�?;��A��x貛�R|� �o�+����g��&hm��x�G�V%%�\"��2R*R�hR���%�%�N6J��F��^�5rs ��^G�D/{[�����e/3{���Jn95�)*S�s���X3��I��<5/��ݠyd�[ߘ�P����)��It�v�f�S)(<D�9���D�y̓��a��a��X.�1�\��Z����<����;? s��	��Ek�A(�Nd��y>yh��#�ʱ�ۜ����d�C�O�� j݁���Cs�Z���Y�6�kky2��/�'������3���!��3(:�,!h~��o����j��]P�H=|����b�+��]�)V�aL�����!�?J"S��0��9�Řc*àv��}^q��#�	FZr���G������#��u�_��B�$g�)�p�>��:gP�`�[�oa����t��:��^6�8�;DG9�k���1S�&_e
�ᅉİ����O��1�\�|�Ԑ�G��_G1���'�Y���޹�E�[�_��x���4!�)L��pFQ�����.�_��a�:}������}�]�� O:���8��i�t!"D`,	a�:�Wq��\dl����=�z��/cW_��R�b�1$a=L�0#q�Շ��x{��#���&�vX�΄{3�2ٜ��O������K[�~�Fb�X��j�+:���w-H7��ɀy�	-Z&�Lh��2�eB˄�	�&��ぐ�6���*����B��JBI��X����x��[]�[XQ�l���s���/��o��+�|�O�~q(������X�j!-Z0�`h�Ђ���D[0�`����)����r�ɸ�X9ECz!3a�pA��D`�N�t��;c�(ːىl�Vd�x��,�[L-,�)_6ضu'75՘��Hz<�Ek���dh�В�%CK��/�m�В��K���V�Y����CN� ��;��V*A�\J���!{����z~o���#K����rkq�gkn��-c�������$K�T1�\aٷ�1ԔY6�lh�в�eCˆ|��lh���eÈ�z�B5Lp+�w=����/�>�      h      x������ � �     
--
-- PostgreSQL database dump
--

-- Dumped from database version 14.11 (Homebrew)
-- Dumped by pg_dump version 14.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: challenge; Type: TABLE; Schema: public; Owner: lihsinhuei
--

CREATE TABLE public.challenge (
    challenge_id integer NOT NULL,
    user_id integer NOT NULL,
    start_time timestamp without time zone DEFAULT now(),
    complete_time timestamp without time zone,
    score bit(3)
);


ALTER TABLE public.challenge OWNER TO lihsinhuei;

--
-- Name: challenge_challenge_id_seq; Type: SEQUENCE; Schema: public; Owner: lihsinhuei
--

CREATE SEQUENCE public.challenge_challenge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.challenge_challenge_id_seq OWNER TO lihsinhuei;

--
-- Name: challenge_challenge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lihsinhuei
--

ALTER SEQUENCE public.challenge_challenge_id_seq OWNED BY public.challenge.challenge_id;


--
-- Name: records; Type: TABLE; Schema: public; Owner: lihsinhuei
--

CREATE TABLE public.records (
    record_id integer NOT NULL,
    challenge_id integer NOT NULL,
    question_no smallint NOT NULL,
    given_number integer NOT NULL,
    is_skip boolean NOT NULL,
    file_name character(50) NOT NULL,
    transcribe character(100) NOT NULL,
    user_answer_num integer,
    is_correct boolean
);


ALTER TABLE public.records OWNER TO lihsinhuei;

--
-- Name: records_record_id_seq; Type: SEQUENCE; Schema: public; Owner: lihsinhuei
--

CREATE SEQUENCE public.records_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.records_record_id_seq OWNER TO lihsinhuei;

--
-- Name: records_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lihsinhuei
--

ALTER SEQUENCE public.records_record_id_seq OWNED BY public.records.record_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: lihsinhuei
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email text NOT NULL,
    password_hash character varying(100) NOT NULL,
    joined_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO lihsinhuei;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: lihsinhuei
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO lihsinhuei;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lihsinhuei
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: challenge challenge_id; Type: DEFAULT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.challenge ALTER COLUMN challenge_id SET DEFAULT nextval('public.challenge_challenge_id_seq'::regclass);


--
-- Name: records record_id; Type: DEFAULT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.records ALTER COLUMN record_id SET DEFAULT nextval('public.records_record_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: challenge challenge_pkey; Type: CONSTRAINT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.challenge
    ADD CONSTRAINT challenge_pkey PRIMARY KEY (challenge_id);


--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (record_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: challenge challenge_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.challenge
    ADD CONSTRAINT challenge_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: records records_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lihsinhuei
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenge(challenge_id);


--
-- PostgreSQL database dump complete
--


--
-- PostgreSQL database dump
--

-- Dumped from database version 13.9 (Ubuntu 13.9-1.pgdg20.04+1)
-- Dumped by pg_dump version 13.9 (Ubuntu 13.9-1.pgdg20.04+1)

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

--
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;


--
-- Name: EXTENSION btree_gin; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: cube; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS cube WITH SCHEMA public;


--
-- Name: EXTENSION cube; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION cube IS 'data type for multidimensional cubes';


--
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA public;


--
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- Name: dict_int; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dict_int WITH SCHEMA public;


--
-- Name: EXTENSION dict_int; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION dict_int IS 'text search dictionary template for integers';


--
-- Name: dict_xsyn; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dict_xsyn WITH SCHEMA public;


--
-- Name: EXTENSION dict_xsyn; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION dict_xsyn IS 'text search dictionary template for extended synonym processing';


--
-- Name: earthdistance; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS earthdistance WITH SCHEMA public;


--
-- Name: EXTENSION earthdistance; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION earthdistance IS 'calculate great-circle distances on the surface of the Earth';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: hstore; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS hstore WITH SCHEMA public;


--
-- Name: EXTENSION hstore; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION hstore IS 'data type for storing sets of (key, value) pairs';


--
-- Name: intarray; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS intarray WITH SCHEMA public;


--
-- Name: EXTENSION intarray; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION intarray IS 'functions, operators, and index support for 1-D arrays of integers';


--
-- Name: ltree; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;


--
-- Name: EXTENSION ltree; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgrowlocks; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgrowlocks WITH SCHEMA public;


--
-- Name: EXTENSION pgrowlocks; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgrowlocks IS 'show row-level locking information';


--
-- Name: pgstattuple; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgstattuple WITH SCHEMA public;


--
-- Name: EXTENSION pgstattuple; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgstattuple IS 'show tuple-level statistics';


--
-- Name: tablefunc; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;


--
-- Name: EXTENSION tablefunc; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION tablefunc IS 'functions that manipulate whole tables, including crosstab';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: xml2; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS xml2 WITH SCHEMA public;


--
-- Name: EXTENSION xml2; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION xml2 IS 'XPath querying and XSLT';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: yxybxtdv
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    image_url text NOT NULL,
    project_name character varying(20),
    project_desc text NOT NULL,
    frontend_url text,
    backend_url text,
    video_url text
);


ALTER TABLE public.projects OWNER TO yxybxtdv;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: yxybxtdv
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projects_id_seq OWNER TO yxybxtdv;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: yxybxtdv
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: studyposts; Type: TABLE; Schema: public; Owner: yxybxtdv
--

CREATE TABLE public.studyposts (
    id integer NOT NULL,
    title character varying(20) NOT NULL,
    content text NOT NULL
);


ALTER TABLE public.studyposts OWNER TO yxybxtdv;

--
-- Name: studyposts_id_seq; Type: SEQUENCE; Schema: public; Owner: yxybxtdv
--

CREATE SEQUENCE public.studyposts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.studyposts_id_seq OWNER TO yxybxtdv;

--
-- Name: studyposts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: yxybxtdv
--

ALTER SEQUENCE public.studyposts_id_seq OWNED BY public.studyposts.id;


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: yxybxtdv
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: studyposts id; Type: DEFAULT; Schema: public; Owner: yxybxtdv
--

ALTER TABLE ONLY public.studyposts ALTER COLUMN id SET DEFAULT nextval('public.studyposts_id_seq'::regclass);


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: yxybxtdv
--

COPY public.projects (id, image_url, project_name, project_desc, frontend_url, backend_url, video_url) FROM stdin;
1	https://bl6pap003files.storage.live.com/y4m1nlpO916ihaY3HB03r2rLD-GOqhDj2X4yVRd2Qdr2G1XDPVQM063vItz6UtBnJEHeP5IYvVKExK5USipzb_Fjw37a7H4H2ZKjk2-uagoP26tGyR3BqoCtSKhL7Ux-hrWIXKLU-RJqMl7TBLdXpeyqzgimVAinjx3JNNIvAAL1dje6imGIslq4EDP86tSLOGU?width=1280&height=645&cropmode=none	Sistema de Cobranças	Esta aplicação foi o último desafio do curso de Desenvolvimento de Softwares da Cubos Academy, cujo qual foi um desafio em squads que atuaram dentro dos rituais da metodologia ágil Scrum. Durante o desafio, eu fui elegido pelos meus colegas como líder e atuei tanto como backend quanto como frontend, contribuindo significativamente em ambas as stacks. \n Tivemos algumas dificuldades durante o desafio que foram superadas, entretanto, problemas foram deixados na aplicação, problemas esses que deixaram a mesma com falhas que tornam desagradável testá-la, por esse motivo eu não disponibilizo neste momento um vídeo para tal. (Eu havia feito uma versão com a maioria dos erros corrigidos, entretanto, os poucos erros que restaram ainda deixavam o projeto desinteressante, principalmente na sua estrutura, portanto, decidi excluir a minha versão melhorada, para começar outra totalmente do zero, sozinho). Disponibilizarei um vídeo assim que reconstruí-lo.	https://github.com/PatrickOtero/front-integral-m05-desafio-t04	https://github.com/PatrickOtero/back-integral-m05-desafio-t04	
4	https://by3302files.storage.live.com/y4mSL1bD6R9bG6RPLpwsmHsXCom0EdNYhlwkEi8ZY2XyGqkNMb9BX8Xzm0RQ314hgG9tlOVriSK1FssGGnmpOWMqyF2AsD5vv5o7Q8_xucFrTSJ4lALcR0V4x8sYPlX5fnWlqnBL5xmuBh-vN_Pr6TbMyXV6kuRB4HlvXW4PBqoA9Fz-VFRTHe_nfQwx8LOniHM?width=1920&height=959&cropmode=none	Desafio téc - Blox	Foi um projeto frontend de nível júnior/pleno exigido pela empresa Omnix. Fiz com Typescript, Material-ui, React-router-dom e Styled components	https://github.com/PatrickOtero/blox-frontend-challenge		https://www.linkedin.com/feed/update/urn:li:activity:6980614330547384321/
2	https://by3302files.storage.live.com/y4mKSEZSPqwQhVwQvrdPyNW-h-ahrZheqq86q7B11CvQj5wbdb3L7JfBnJabWI-xB0uNZmSvw74Q_4oU1QUr3nKBli3AxoGOnY7jI1KE3BQ0IEzUehrYpEfkAVkQCs4PI83dhq9TCvKS-mSjYIqdPitGJcBSjpqEzfEb9EXn0Ig_Hw6AGESKU41dOpg7uuIZ1Fe?width=1920&height=956&cropmode=none	Go Barber	Web app baseado no projeto open-source GoBarber da Rocketseat com várias diferenças na estrutura e funcionalidade. Em termos gerais, minha versão é um pouco mais simples. Frontend feito com React.js e backend feito com Node.js e express.	https://github.com/PatrickOtero/Go-Barber-front-end	https://github.com/PatrickOtero/Go-Barber-back-end	https://www.linkedin.com/feed/update/urn:li:activity:6968465035173986304/
3	https://by3302files.storage.live.com/y4m0l1_4BL8BeU_JFVGKkgadWnCH29DmXOB51uojMwjPG2gKAmMyRdJIhSVmO9MtN0jYsXLKn83VQtfwl6i61FTckUGRaEvwWRqA0blfHM_y93CKDw6DoDLbSYKw7qVo3dkOl8HhTI0WHu5vHF7QOYlWN7MeCeSC8buWV4ynTaz5qZV7HcwW0tXyjouOnVnx30L?width=1920&height=964&cropmode=none	Dindin	Terceiro desafio de frontend exigido pela Cubos Academy. O projeto deveria ser feito com React.js e sua API já veio pronta, pois o desafio não era fullstack, entretanto eu reconstruí o projeto do zero com todo o novo conhecimento que adquiri após concluir o curso, construindo também até mesmo a sua api. O projeto não exigia componentização, mas na reconstrução tudo foi componentizado, e seus dados (estados e funções) são compartilhados através da Context API e com sistema de rotas através do React-router-dom. Seu backend foi construído com Node.js e express, além de integrado com banco de dados postgresql através do query builder Knex que por sua vez necessita da biblioteca de conexão node-postgres (pg). Sua api conta com um sistema de cadastro, login, criptografia de senhas e autenticação via jsonwebtoken. Além dessas novas funcionalidades, o projeto conta com uma interface melhorada.	https://github.com/PatrickOtero/App-Dindin	https://github.com/PatrickOtero/API-Dindin	https://www.linkedin.com/feed/update/urn:li:activity:6969481925438652416/
5	https://by3302files.storage.live.com/y4m-5_dCHVAZQyo1mNcwCUtH-qQI0LlplIatBr5-I2G4lUir5RVlR64uQwEN9jCP1i-VDNzRGot4a6s1wu4s9pSTy8YzC7HPHyWhkZFS-qTGwVxeIOGuVNTJU5U6hmDlq3OLZFQcfKS9doFo8WlMvEP5sQ_Leg_bPlbR-YIIG-6yUmGDAj6JkAh_5Inkyh4I1vp?width=1920&height=963&cropmode=none	Desafio téc - Omnix	Foi um projeto frontend simples exigido pela empresa Omnix. Fiz com Typescript, Material-ui, React-router-dom e Styled components	https://github.com/PatrickOtero/Omnix-challenge		https://www.linkedin.com/feed/update/urn:li:activity:6986064235319439360/
\.


--
-- Data for Name: studyposts; Type: TABLE DATA; Schema: public; Owner: yxybxtdv
--

COPY public.studyposts (id, title, content) FROM stdin;
\.


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: yxybxtdv
--

SELECT pg_catalog.setval('public.projects_id_seq', 5, true);


--
-- Name: studyposts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: yxybxtdv
--

SELECT pg_catalog.setval('public.studyposts_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--


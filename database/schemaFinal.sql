--
-- PostgreSQL database dump
--

\restrict nHOp3PqoJwkIFGvmTY9TeITclb0jo8peQr4PrcLr0sRV8l6Pie2QeYKmghs6Fmg

-- Dumped from database version 17.11 (Homebrew)
-- Dumped by pg_dump version 17.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_logs (
    audit_id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id uuid,
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_admin_audit_action CHECK (((action)::text = ANY ((ARRAY['skill_created'::character varying, 'skill_updated'::character varying, 'skill_activated'::character varying, 'skill_deactivated'::character varying, 'skill_alias_added'::character varying, 'review_approved'::character varying, 'review_mapped'::character varying, 'review_rejected'::character varying])::text[]))),
    CONSTRAINT chk_admin_audit_entity CHECK (((entity_type)::text = ANY ((ARRAY['skill'::character varying, 'skill_review'::character varying])::text[])))
);


--
-- Name: analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis (
    analysis_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    resume_id uuid NOT NULL,
    job_id uuid,
    match_score numeric(5,2) DEFAULT 0 NOT NULL,
    analysis_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    analysis_type character varying(20) DEFAULT 'job_specific'::character varying NOT NULL,
    overall_score numeric(5,2) DEFAULT 0 NOT NULL,
    confidence_score numeric(5,2) DEFAULT 0 NOT NULL,
    result_json jsonb,
    ai_provider character varying(30),
    ai_model character varying(120),
    ai_key_source character varying(20),
    input_tokens integer,
    output_tokens integer,
    total_tokens integer,
    request_duration_ms integer,
    CONSTRAINT analysis_match_score_check CHECK (((match_score >= (0)::numeric) AND (match_score <= (100)::numeric))),
    CONSTRAINT chk_analysis_ai_key_source CHECK (((ai_key_source IS NULL) OR ((ai_key_source)::text = ANY ((ARRAY['user'::character varying, 'platform'::character varying])::text[])))),
    CONSTRAINT chk_analysis_confidence_score CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric))),
    CONSTRAINT chk_analysis_overall_score CHECK (((overall_score >= (0)::numeric) AND (overall_score <= (100)::numeric))),
    CONSTRAINT chk_analysis_type_job_id CHECK (((((analysis_type)::text = 'general'::text) AND (job_id IS NULL)) OR (((analysis_type)::text = 'job_specific'::text) AND (job_id IS NOT NULL))))
);


--
-- Name: ats_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ats_analysis (
    ats_id uuid DEFAULT gen_random_uuid() NOT NULL,
    analysis_id uuid NOT NULL,
    ats_score numeric(5,2) DEFAULT 0 NOT NULL,
    keyword_score numeric(5,2) DEFAULT 0 NOT NULL,
    formatting_score numeric(5,2) DEFAULT 0 NOT NULL,
    structure_score numeric(5,2) DEFAULT 0 NOT NULL,
    scoring_breakdown jsonb,
    CONSTRAINT ats_formatting_score_check CHECK (((formatting_score >= (0)::numeric) AND (formatting_score <= (100)::numeric))),
    CONSTRAINT ats_keyword_score_check CHECK (((keyword_score >= (0)::numeric) AND (keyword_score <= (100)::numeric))),
    CONSTRAINT ats_score_check CHECK (((ats_score >= (0)::numeric) AND (ats_score <= (100)::numeric))),
    CONSTRAINT chk_ats_structure_score CHECK (((structure_score >= (0)::numeric) AND (structure_score <= (100)::numeric)))
);


--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_sessions (
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash character(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    user_agent text,
    ip_address inet,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: career_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.career_recommendations (
    career_recommendation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    analysis_id uuid NOT NULL,
    career_title character varying(200) NOT NULL,
    match_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    reasoning text,
    required_skills jsonb DEFAULT '[]'::jsonb NOT NULL,
    missing_skills jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT career_match_percentage_check CHECK (((match_percentage >= (0)::numeric) AND (match_percentage <= (100)::numeric)))
);


--
-- Name: job_descriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_descriptions (
    job_id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_title character varying(200) NOT NULL,
    company character varying(200),
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id uuid,
    visibility character varying(20) DEFAULT 'public'::character varying NOT NULL,
    CONSTRAINT chk_job_descriptions_visibility CHECK (((visibility)::text = ANY ((ARRAY['private'::character varying, 'public'::character varying])::text[]))),
    CONSTRAINT chk_system_jobs_public CHECK (((user_id IS NOT NULL) OR ((visibility)::text = 'public'::text)))
);


--
-- Name: job_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_skills (
    job_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    requirement_type character varying(30) DEFAULT 'required'::character varying NOT NULL,
    CONSTRAINT job_skills_requirement_type_check CHECK (((requirement_type)::text = ANY ((ARRAY['required'::character varying, 'preferred'::character varying])::text[])))
);


--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommendations (
    recommendation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    analysis_id uuid NOT NULL,
    recommendation_text text NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    recommendation_title character varying(250),
    category character varying(30),
    example text,
    CONSTRAINT chk_recommendation_category CHECK (((category IS NULL) OR ((category)::text = ANY ((ARRAY['content'::character varying, 'formatting'::character varying, 'skills'::character varying, 'experience'::character varying, 'education'::character varying, 'ats'::character varying, 'other'::character varying])::text[])))),
    CONSTRAINT recommendations_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])))
);


--
-- Name: resume_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_skills (
    resume_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    proficiency character varying(50)
);


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resumes (
    resume_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    resume_title character varying(200) NOT NULL,
    file_path text NOT NULL,
    upload_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    original_file_name character varying(255),
    mime_type character varying(100),
    file_size_bytes bigint,
    extracted_text text
);


--
-- Name: skill_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_aliases (
    alias_id uuid DEFAULT gen_random_uuid() NOT NULL,
    skill_id uuid NOT NULL,
    alias_name character varying(150) NOT NULL,
    normalized_alias character varying(150) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_alias_normalized_name CHECK (((normalized_alias)::text = lower(regexp_replace(TRIM(BOTH FROM alias_name), '[[:space:]_.-]+'::text, ''::text, 'g'::text))))
);


--
-- Name: skill_catalog_review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_catalog_review (
    review_id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposed_skill_name character varying(150) NOT NULL,
    normalized_name character varying(150) NOT NULL,
    category character varying(100),
    description text,
    source character varying(50) DEFAULT 'ai'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp with time zone,
    review_reason character varying(30) DEFAULT 'not_found'::character varying NOT NULL,
    possible_matches text[] DEFAULT '{}'::text[] NOT NULL,
    evidence text,
    reviewed_by uuid,
    mapped_skill_id uuid,
    decision character varying(30),
    review_notes text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_skill_review_decision CHECK (((decision IS NULL) OR ((decision)::text = ANY ((ARRAY['approved_new'::character varying, 'mapped_existing'::character varying, 'rejected'::character varying])::text[])))),
    CONSTRAINT chk_skill_review_decision_status CHECK (((((status)::text = 'pending'::text) AND (decision IS NULL) AND (mapped_skill_id IS NULL)) OR (((status)::text = 'approved'::text) AND ((decision)::text = 'approved_new'::text) AND (mapped_skill_id IS NULL)) OR (((status)::text = 'approved'::text) AND ((decision)::text = 'mapped_existing'::text) AND (mapped_skill_id IS NOT NULL)) OR (((status)::text = 'rejected'::text) AND ((decision)::text = 'rejected'::text)))),
    CONSTRAINT chk_skill_review_reason CHECK (((review_reason)::text = ANY ((ARRAY['not_found'::character varying, 'ambiguous'::character varying, 'low_confidence'::character varying])::text[]))),
    CONSTRAINT chk_skill_review_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: skill_gaps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_gaps (
    gap_id uuid DEFAULT gen_random_uuid() NOT NULL,
    analysis_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    reason text,
    importance_level character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    learning_recommendation text,
    CONSTRAINT skill_gaps_importance_check CHECK (((importance_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])))
);


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    skill_id uuid DEFAULT gen_random_uuid() NOT NULL,
    skill_name character varying(120) NOT NULL,
    category character varying(100),
    description text,
    normalized_name character varying(150) NOT NULL,
    parent_skill_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    professional_field character varying(100),
    CONSTRAINT chk_skill_normalized_name CHECK (((normalized_name)::text = lower(regexp_replace(TRIM(BOTH FROM skill_name), '[[:space:]_.-]+'::text, ''::text, 'g'::text)))),
    CONSTRAINT chk_skill_not_own_parent CHECK (((parent_skill_id IS NULL) OR (parent_skill_id <> skill_id)))
);


--
-- Name: user_ai_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_ai_settings (
    user_id uuid NOT NULL,
    provider character varying(30) DEFAULT 'gemini'::character varying NOT NULL,
    api_key_ciphertext text NOT NULL,
    api_key_iv character varying(32) NOT NULL,
    api_key_auth_tag character varying(32) NOT NULL,
    model character varying(120),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_user_ai_provider CHECK (((provider)::text = 'gemini'::text))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(30) DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (audit_id);


--
-- Name: analysis analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis
    ADD CONSTRAINT analysis_pkey PRIMARY KEY (analysis_id);


--
-- Name: ats_analysis ats_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ats_analysis
    ADD CONSTRAINT ats_analysis_pkey PRIMARY KEY (ats_id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: auth_sessions auth_sessions_refresh_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_refresh_token_hash_key UNIQUE (refresh_token_hash);


--
-- Name: career_recommendations career_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_recommendations
    ADD CONSTRAINT career_recommendations_pkey PRIMARY KEY (career_recommendation_id);


--
-- Name: job_descriptions job_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_descriptions
    ADD CONSTRAINT job_descriptions_pkey PRIMARY KEY (job_id);


--
-- Name: job_skills job_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_id);


--
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (recommendation_id);


--
-- Name: resume_skills resume_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_skills
    ADD CONSTRAINT resume_skills_pkey PRIMARY KEY (resume_id, skill_id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (resume_id);


--
-- Name: skill_aliases skill_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_aliases
    ADD CONSTRAINT skill_aliases_pkey PRIMARY KEY (alias_id);


--
-- Name: skill_catalog_review skill_catalog_review_normalized_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_catalog_review
    ADD CONSTRAINT skill_catalog_review_normalized_name_key UNIQUE (normalized_name);


--
-- Name: skill_catalog_review skill_catalog_review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_catalog_review
    ADD CONSTRAINT skill_catalog_review_pkey PRIMARY KEY (review_id);


--
-- Name: skill_gaps skill_gaps_analysis_skill_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_gaps
    ADD CONSTRAINT skill_gaps_analysis_skill_unique UNIQUE (analysis_id, skill_id);


--
-- Name: skill_gaps skill_gaps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_gaps
    ADD CONSTRAINT skill_gaps_pkey PRIMARY KEY (gap_id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (skill_id);


--
-- Name: skills skills_skill_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_skill_name_key UNIQUE (skill_name);


--
-- Name: skill_aliases uq_skill_alias_normalized; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_aliases
    ADD CONSTRAINT uq_skill_alias_normalized UNIQUE (normalized_alias);


--
-- Name: user_ai_settings user_ai_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ai_settings
    ADD CONSTRAINT user_ai_settings_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_admin_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_action ON public.admin_audit_logs USING btree (action);


--
-- Name: idx_admin_audit_admin_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_admin_user ON public.admin_audit_logs USING btree (admin_user_id);


--
-- Name: idx_admin_audit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_created_at ON public.admin_audit_logs USING btree (created_at DESC);


--
-- Name: idx_admin_audit_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_entity ON public.admin_audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_analysis_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_date ON public.analysis USING btree (analysis_date DESC);


--
-- Name: idx_analysis_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_job_id ON public.analysis USING btree (job_id);


--
-- Name: idx_analysis_resume_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_resume_date ON public.analysis USING btree (resume_id, analysis_date DESC);


--
-- Name: idx_analysis_resume_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_resume_id ON public.analysis USING btree (resume_id);


--
-- Name: idx_analysis_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_type ON public.analysis USING btree (analysis_type);


--
-- Name: idx_analysis_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_user_date ON public.analysis USING btree (user_id, analysis_date DESC);


--
-- Name: idx_analysis_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_user_id ON public.analysis USING btree (user_id);


--
-- Name: idx_ats_analysis_analysis_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ats_analysis_analysis_id ON public.ats_analysis USING btree (analysis_id);


--
-- Name: idx_auth_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_active ON public.auth_sessions USING btree (user_id, expires_at) WHERE (revoked_at IS NULL);


--
-- Name: idx_auth_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions USING btree (expires_at);


--
-- Name: idx_auth_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions USING btree (user_id);


--
-- Name: idx_career_recommendations_analysis_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_career_recommendations_analysis_id ON public.career_recommendations USING btree (analysis_id);


--
-- Name: idx_job_descriptions_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_descriptions_title ON public.job_descriptions USING btree (job_title);


--
-- Name: idx_job_descriptions_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_descriptions_user_created ON public.job_descriptions USING btree (user_id, created_at DESC);


--
-- Name: idx_job_descriptions_visibility_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_descriptions_visibility_created ON public.job_descriptions USING btree (visibility, created_at DESC);


--
-- Name: idx_job_skills_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_skills_skill_id ON public.job_skills USING btree (skill_id);


--
-- Name: idx_recommendations_analysis_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommendations_analysis_id ON public.recommendations USING btree (analysis_id);


--
-- Name: idx_resume_skills_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_skills_skill_id ON public.resume_skills USING btree (skill_id);


--
-- Name: idx_resumes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resumes_user_id ON public.resumes USING btree (user_id);


--
-- Name: idx_skill_aliases_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skill_aliases_skill_id ON public.skill_aliases USING btree (skill_id);


--
-- Name: idx_skill_gaps_analysis_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skill_gaps_analysis_id ON public.skill_gaps USING btree (analysis_id);


--
-- Name: idx_skill_review_mapped_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skill_review_mapped_skill ON public.skill_catalog_review USING btree (mapped_skill_id);


--
-- Name: idx_skill_review_reason; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skill_review_reason ON public.skill_catalog_review USING btree (review_reason);


--
-- Name: idx_skill_review_reviewed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skill_review_reviewed_by ON public.skill_catalog_review USING btree (reviewed_by);


--
-- Name: idx_skill_review_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skill_review_status ON public.skill_catalog_review USING btree (status);


--
-- Name: idx_skills_active_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skills_active_category ON public.skills USING btree (category) WHERE (is_active = true);


--
-- Name: idx_skills_normalized_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_skills_normalized_name ON public.skills USING btree (normalized_name);


--
-- Name: idx_user_ai_settings_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_ai_settings_updated_at ON public.user_ai_settings USING btree (updated_at DESC);


--
-- Name: admin_audit_logs admin_audit_logs_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: analysis analysis_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis
    ADD CONSTRAINT analysis_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_descriptions(job_id) ON DELETE RESTRICT;


--
-- Name: analysis analysis_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis
    ADD CONSTRAINT analysis_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(resume_id) ON DELETE CASCADE;


--
-- Name: analysis analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis
    ADD CONSTRAINT analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: ats_analysis ats_analysis_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ats_analysis
    ADD CONSTRAINT ats_analysis_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.analysis(analysis_id) ON DELETE CASCADE;


--
-- Name: auth_sessions auth_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: career_recommendations career_recommendations_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_recommendations
    ADD CONSTRAINT career_recommendations_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.analysis(analysis_id) ON DELETE CASCADE;


--
-- Name: job_descriptions fk_job_descriptions_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_descriptions
    ADD CONSTRAINT fk_job_descriptions_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE RESTRICT;


--
-- Name: skills fk_skills_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT fk_skills_parent FOREIGN KEY (parent_skill_id) REFERENCES public.skills(skill_id) ON DELETE SET NULL;


--
-- Name: job_skills job_skills_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_descriptions(job_id) ON DELETE CASCADE;


--
-- Name: job_skills job_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- Name: recommendations recommendations_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.analysis(analysis_id) ON DELETE CASCADE;


--
-- Name: resume_skills resume_skills_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_skills
    ADD CONSTRAINT resume_skills_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(resume_id) ON DELETE CASCADE;


--
-- Name: resume_skills resume_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_skills
    ADD CONSTRAINT resume_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- Name: resumes resumes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: skill_aliases skill_aliases_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_aliases
    ADD CONSTRAINT skill_aliases_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- Name: skill_catalog_review skill_catalog_review_mapped_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_catalog_review
    ADD CONSTRAINT skill_catalog_review_mapped_skill_id_fkey FOREIGN KEY (mapped_skill_id) REFERENCES public.skills(skill_id) ON DELETE SET NULL;


--
-- Name: skill_catalog_review skill_catalog_review_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_catalog_review
    ADD CONSTRAINT skill_catalog_review_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: skill_gaps skill_gaps_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_gaps
    ADD CONSTRAINT skill_gaps_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.analysis(analysis_id) ON DELETE CASCADE;


--
-- Name: skill_gaps skill_gaps_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_gaps
    ADD CONSTRAINT skill_gaps_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- Name: user_ai_settings user_ai_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ai_settings
    ADD CONSTRAINT user_ai_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nHOp3PqoJwkIFGvmTY9TeITclb0jo8peQr4PrcLr0sRV8l6Pie2QeYKmghs6Fmg

/*
pg_dump -h /tmp -p 5432 -U farid -d resumeiq \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file=database/schema.sql
*/
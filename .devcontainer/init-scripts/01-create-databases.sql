-- Create databases for each microservice
CREATE DATABASE auth_service;
CREATE DATABASE catalog_service;
CREATE DATABASE circulation_service;
CREATE DATABASE acquisitions_service;
CREATE DATABASE discovery_service;
CREATE DATABASE reporting_service;

-- Create a shared user for all services (development only)
CREATE USER shellnexa_app WITH PASSWORD 'shellnexa_app_dev';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_service TO shellnexa_app;
GRANT ALL PRIVILEGES ON DATABASE catalog_service TO shellnexa_app;
GRANT ALL PRIVILEGES ON DATABASE circulation_service TO shellnexa_app;
GRANT ALL PRIVILEGES ON DATABASE acquisitions_service TO shellnexa_app;
GRANT ALL PRIVILEGES ON DATABASE discovery_service TO shellnexa_app;
GRANT ALL PRIVILEGES ON DATABASE reporting_service TO shellnexa_app;

-- Connect to each database and grant schema privileges
\c auth_service;
GRANT ALL ON SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shellnexa_app;

\c catalog_service;
GRANT ALL ON SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shellnexa_app;

\c circulation_service;
GRANT ALL ON SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shellnexa_app;

\c acquisitions_service;
GRANT ALL ON SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shellnexa_app;

\c discovery_service;
GRANT ALL ON SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shellnexa_app;

\c reporting_service;
GRANT ALL ON SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shellnexa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shellnexa_app;

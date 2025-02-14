<<<<<<< HEAD
# Sample Project

Welcome to **Sample Project**! This is a brief overview and setup guide for getting started with this Django web application.

## Table of Contents
- [Introduction](#introduction)
- [Setup](#setup)

## Introduction

Sample base project for creating applications.

## Setup

### Installing Dependencies

1. Ensure you have installed python 3.10+
2. PostgreSQL
3. PgAdmin or Dbeaver
   
### Installing Dependencies
```bash
pip install -r requirements.txt
```

### Run below database .sql dump from pgAdmin or Dbeaver
```bash
dump-djangodb-202401290024.sql
```

### Edit env file and put the database configuration details.
1. rename sample.env to .env in ay_connect folder 
2. change environment variables to point it to database.

### Run the Django project
```bash
python manage.py runserver
```

# Other
### When creating new app you need to run these commands to do the necessary migrations
### Running makemigrations
```bash
python manage.py makemigrations <appname>
```
### Running migrate
```bash
python manage.py migrate <appname>
```
=======
# sample_project-jc_process
>>>>>>> b7890c1e8d2a0b567ffb46ff6fa25153c21eec8e

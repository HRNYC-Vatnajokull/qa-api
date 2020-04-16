-- ******************** SCHEMA SETUP ********************

-- create the keyspace
create keyspace qa with replication = {'class': 'SimpleStrategy', 'replication_factor' : 1};
create keyspace stg with replication = {'class': 'SimpleStrategy', 'replication_factor' : 1};

-- create table: questions_by_product
create table qa.questions_by_product (
  product_id int
  , question_date date
  , question_id int
  , body text
  , asker_name text
  , asker_email text
  , helpful int
  , reported int
  , primary key ((product_id), question_date, question_id)
) with comment = 'q1: view al questions for a specific product' and clustering order by (question_date asc, question_id asc);

-- create table: questions
create table qa.questions (
  product_id int
  , question_date date
  , question_id int primary key
) with comment = 'q3: look up a question by question id';

-- create table: answers_by_question
create table qa.answers_by_question (
  question_id int
  , answer_date date
  , answer_id int
  , body text
  , answerer_name text
  , answerer_email text
  , helpful int
  , reported int
  , photos set<text>
  , primary key ((question_id), answer_date, answer_id)
) with comment = 'q2: view all answers for a specific question';

-- create table: answers
create table qa.answers (
  question_id int
  , answer_date date
  , answer_id int primary key
) with comment = 'q4: look up an answer by answer id';

-- create table STG.answer_photos
create table stg.answer_photos (
  answer_id int
  , id int
  , url text
  , primary key (answer_id, id)
);

-- create table qa.next_id
create table qa.next_id (
  type text primary key,
  next_id counter
);
update qa.next_id set next_id = next_id+5000000 where type='question_id';
update qa.next_id set next_id = next_id+50000000 where type='answer_id';
insert into qa.next_id (type, next_id) values ('answer_id', 50000000);



-- ******************** PERFORM DATA LOADING ********************

-- load table: QUESTIONS_BY_PRODUCT
copy qa.questions_by_product (question_id, product_id, body, question_date, asker_name, asker_email, reported, helpful) 
from '/csv_data/questions.csv' 
with header=true;

-- load table: QUESTIONS 
copy qa.questions_by_product (product_id, question_date, question_id) 
to '/tmp/tbl_questions.csv'
with header=true;

copy qa.questions (product_id, question_date, question_id) 
from '/tmp/tbl_questions.csv'
with header=true;

-- load table: ANSWERS_BY_QUESTION 
copy qa.answers_by_question (answer_id, question_id, body, answer_date, answerer_name, answerer_email, reported, helpful) 
from '/csv_data/answers.csv' 
with header=true and skipcols='photos';

-- load table: ANSWERS 
copy qa.answers_by_question (question_id, answer_date, answer_id) 
to '/tmp/tbl_answers.csv'
with header=true;

copy qa.answers (question_id, answer_date, answer_id) 
from '/tmp/tbl_answers.csv'
with header=true;

-- load table: STG.ANSWER_PHOTOS
copy stg.answer_photos (id, answer_id, url)
from '/csv_data/answers_photos.csv'
with header=true;

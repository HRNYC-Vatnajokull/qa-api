-- create the keyspace
create keyspace qa with replication = {'class': 'SimpleStrategy', 'replication_factor' : 1};

-- create questions_by_product table
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

-- create questions table
create table qa.questions (
  product_id int
  , question_id int primary key
) with comment = 'q3: look up a question by question id';

-- create answers_by_question table
create table qa.answers_by_question (
  question_id int
  , answer_date date
  , answer_id int
  , body text
  , answerer_name text
  , answerer_email text
  , helpful int
  , reported int
  , photos list<text>
  , primary key ((question_id), answer_date, answer_id)
) with comment = 'q2: view all answers for a specific question';

-- create answers table
create table qa.answers (
  question_id int
  , answer_id int primary key
) with comment = 'q4: look up an answer by answer id';


-- load questions_by_product table
copy qa.questions_by_product (question_id, product_id, body, question_date, asker_name, asker_email, reported, helpful) 
from '/csv_data/questions.csv' 
with header=true;

-- load questions table
copy qa.questions_by_product (product_id, question_id) 
to '/tmp/tbl_questions.csv'
with header=true;

copy qa.questions (product_id, question_id) 
from '/tmp/tbl_questions.csv'
with header=true;

-- load answers_by_question table
copy qa.answers_by_question (answer_id, question_id, body, answer_date, answerer_name, answerer_email, reported, helpful) 
from '/csv_data/answers.csv' 
with header=true and skipcols='photos';

-- load answers table
copy qa.answers_by_question (question_id, answer_id) 
to '/tmp/tbl_answers.csv'
with header=true;

copy qa.answers (question_id, answer_id) 
from '/tmp/tbl_answers.csv'
with header=true;

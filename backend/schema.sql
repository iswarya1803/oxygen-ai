CREATE DATABASE IF NOT EXISTS oxygen_sports;
USE oxygen_sports;

CREATE TABLE IF NOT EXISTS generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  primary_subject VARCHAR(255) NOT NULL,
  specific_requirements TEXT,
  constraints TEXT,
  preferences TEXT,
  structured_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  rating INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  generation_id INT,
  action_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generation_id) REFERENCES generations(id) ON DELETE CASCADE
);

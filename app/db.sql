CREATE DATABASE  IF NOT EXISTS `reimbursement_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `reimbursement_db`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: reimbursement_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approval_rules`
--

DROP TABLE IF EXISTS `approval_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int DEFAULT NULL,
  `rule_type` varchar(50) NOT NULL,
  `percentage_value` float DEFAULT NULL,
  `specific_approver_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `specific_approver_id` (`specific_approver_id`),
  KEY `ix_approval_rules_id` (`id`),
  CONSTRAINT `approval_rules_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `approval_rules_ibfk_2` FOREIGN KEY (`specific_approver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_rules`
--

LOCK TABLES `approval_rules` WRITE;
/*!40000 ALTER TABLE `approval_rules` DISABLE KEYS */;
INSERT INTO `approval_rules` VALUES (4,3,'hybrid',60,1);
/*!40000 ALTER TABLE `approval_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `approval_steps`
--

DROP TABLE IF EXISTS `approval_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_steps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int DEFAULT NULL,
  `approver_id` int DEFAULT NULL,
  `step_order` int NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `action_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `approver_id` (`approver_id`),
  KEY `ix_approval_steps_id` (`id`),
  CONSTRAINT `approval_steps_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`),
  CONSTRAINT `approval_steps_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_steps`
--

LOCK TABLES `approval_steps` WRITE;
/*!40000 ALTER TABLE `approval_steps` DISABLE KEYS */;
INSERT INTO `approval_steps` VALUES (1,1,2,1,'pending',NULL,NULL),(2,1,1,2,'pending',NULL,NULL),(3,2,2,1,'approved','Looks valid','2026-03-29 07:22:40'),(4,2,1,2,'pending',NULL,NULL),(5,3,2,1,'approved','ok','2026-03-29 07:53:39'),(6,3,1,2,'pending',NULL,NULL),(7,4,2,1,'pending',NULL,NULL),(8,4,1,2,'pending',NULL,NULL),(9,5,2,1,'rejected','','2026-03-29 11:25:55'),(10,5,1,2,'pending',NULL,NULL),(11,6,2,1,'approved','','2026-03-29 11:12:20'),(12,6,1,2,'pending',NULL,NULL),(13,7,2,1,'approved','okay sanjana manager, you also please approve this ','2026-03-29 11:16:48'),(14,7,1,2,'pending',NULL,NULL);
/*!40000 ALTER TABLE `approval_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `country` varchar(100) NOT NULL,
  `default_currency` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_companies_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (3,'ABC Corp','India','INR'),(4,'Test Corp','India','INR');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `amount_original` float NOT NULL,
  `currency_original` varchar(10) NOT NULL,
  `amount_converted` float NOT NULL,
  `currency_converted` varchar(10) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `expense_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `current_step` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `company_id` (`company_id`),
  KEY `ix_expenses_id` (`id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,3,3,100,'USD',8300,'INR','Travel','Taxi from airport','2026-03-29','pending',1),(2,3,3,120,'USD',9960,'INR','Food','Dinner meeting','2026-03-29','pending',1),(3,3,3,500,'USD',41500,'INR','travel','Train','2026-03-29','pending',1),(4,3,3,100,'USD',9477,'INR','Travel','Airport taxi','2026-03-29','pending',1),(5,3,3,930,'USD',88136.1,'INR','Food','temptations','2015-07-29','rejected',1),(6,3,3,1750,'INR',1750,'INR','Food','prashant corner','2018-09-01','pending',1),(7,3,3,1000,'INR',1000,'INR','Food','hot idli','2026-03-29','pending',1);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rule_approvers`
--

DROP TABLE IF EXISTS `rule_approvers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_approvers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rule_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `sequence` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rule_id` (`rule_id`),
  KEY `user_id` (`user_id`),
  KEY `ix_rule_approvers_id` (`id`),
  CONSTRAINT `rule_approvers_ibfk_1` FOREIGN KEY (`rule_id`) REFERENCES `approval_rules` (`id`),
  CONSTRAINT `rule_approvers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_approvers`
--

LOCK TABLES `rule_approvers` WRITE;
/*!40000 ALTER TABLE `rule_approvers` DISABLE KEYS */;
INSERT INTO `rule_approvers` VALUES (7,4,2,1),(8,4,1,2);
/*!40000 ALTER TABLE `rule_approvers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `company_id` int DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `is_manager_approver` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `company_id` (`company_id`),
  KEY `manager_id` (`manager_id`),
  KEY `ix_users_id` (`id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Sai Admin','admin6@abc.com','$2b$12$9NobQqsBHCx0rPW3HtXaJuOzm.ek8RBTl10Z32Z7ehol.EX8pSDCG','admin',3,NULL,1),(2,'Rahul Manager','manager1@abc.com','$2b$12$JrHjDGMCWID5qWWDoVo2s.1PsD8MYkD1QzUg85u/.Vkwa3cS81hCG','manager',3,NULL,1),(3,'Ravi Employee','employee1@abc.com','$2b$12$RLGNqULvzDa5twAA0IVGCuxq8.5A2OG6hRy6U3W5dgV0KuBzTdb1C','employee',3,2,1),(4,'Jane Doe','jane_doe@testcorp.com','$2b$12$0Gjg8tQqMNXCwp1aWhwDs.vKQTotbauVcom/e7T6eQ4l0Ry5kj45u','admin',4,NULL,0),(5,'San Admin','admin7@abc.com','$2b$12$ButvPBDnLBBDvt69y5dCle831A3CuPbgnJRVFbI8L/CSYKMJDCOWm','admin',3,NULL,1),(6,'sanjana manager','manager2@abc.com','$2b$12$74Xa3lDfGjc6xMuZgQb9N.9kn3NNL1JiELVmfAr34tBjMrLP2bp7W','manager',3,NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-29 17:03:15

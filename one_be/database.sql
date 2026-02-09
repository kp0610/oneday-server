-- MySQL dump 10.13  Distrib 8.0.44, for macos14.8 (arm64)
--
-- Host: route.nois.club    Database: team7_db
-- ------------------------------------------------------
-- Server version	5.7.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `daily_steps`
--

DROP TABLE IF EXISTS `daily_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `steps` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `weight` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`date`),
  CONSTRAINT `daily_steps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=608 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_steps`
--

LOCK TABLES `daily_steps` WRITE;
/*!40000 ALTER TABLE `daily_steps` DISABLE KEYS */;
INSERT INTO `daily_steps` VALUES (1,2,'2025-12-09',600,'2025-12-09 08:25:44','2025-12-09 08:26:03',NULL),(12,2,'2025-12-11',5200,'2025-12-11 03:47:50','2025-12-11 03:50:35',NULL),(18,2,'2025-12-13',0,'2025-12-13 15:24:24','2025-12-13 15:24:24',NULL),(19,2,'2025-12-14',0,'2025-12-14 11:47:06','2025-12-14 11:47:06',NULL),(21,2,'2025-12-16',0,'2025-12-16 13:35:29','2025-12-16 13:35:29',NULL),(22,1,'2025-12-18',300,'2025-12-18 02:01:05','2025-12-18 03:38:02',NULL),(24,1,'2025-12-10',0,'2025-12-18 03:32:40','2025-12-18 03:32:40',NULL),(26,1,'2025-12-17',700,'2025-12-18 03:33:51','2025-12-18 04:43:26',NULL),(31,1,'2025-12-11',0,'2025-12-18 03:44:00','2025-12-18 03:44:00',NULL),(33,1,'2025-12-14',0,'2025-12-18 03:58:01','2025-12-18 03:58:01',NULL),(36,1,'2025-12-12',0,'2025-12-18 04:41:02','2025-12-18 04:41:02',NULL),(41,1,'2025-12-15',300,'2025-12-18 04:44:51','2025-12-18 04:44:55',NULL),(44,1,'2025-12-09',0,'2025-12-18 04:45:14','2025-12-18 04:45:14',NULL),(45,1,'2025-12-23',0,'2025-12-18 04:45:16','2025-12-18 04:45:16',NULL),(47,1,'2025-12-16',900,'2025-12-18 04:45:39','2025-12-18 04:45:43',NULL),(54,2,'2025-12-18',0,'2025-12-18 04:46:53','2025-12-18 04:46:53',NULL),(57,2,'2025-12-19',0,'2025-12-18 04:47:48','2025-12-18 04:47:48',NULL),(59,4,'2025-12-18',0,'2025-12-18 05:05:39','2025-12-18 05:05:39',NULL),(60,4,'2025-12-11',700,'2025-12-18 05:05:43','2025-12-18 05:06:05',NULL),(63,1,'2025-12-19',0,'2025-12-19 02:57:24','2025-12-19 02:57:24',NULL),(66,2,'2025-12-31',0,'2025-12-31 11:07:38','2025-12-31 11:07:38',NULL),(67,2,'2026-03-16',0,'2025-12-31 11:08:26','2025-12-31 11:08:26',NULL),(68,2,'2026-03-17',0,'2025-12-31 11:09:00','2025-12-31 11:09:00',NULL),(69,2,'2026-03-11',0,'2025-12-31 11:09:03','2025-12-31 11:09:03',NULL),(70,2,'2026-03-15',0,'2025-12-31 11:09:05','2025-12-31 11:09:05',NULL),(71,2,'2026-03-09',0,'2025-12-31 11:09:20','2025-12-31 11:09:20',NULL),(72,2,'2026-03-10',0,'2025-12-31 11:09:22','2025-12-31 11:09:22',NULL),(248,1,'2026-01-07',0,'2026-01-07 08:53:41','2026-01-07 08:53:41',NULL),(266,1,'2026-01-31',0,'2026-01-07 10:20:02','2026-01-07 10:20:02',NULL),(269,1,'2026-01-03',0,'2026-01-07 10:32:32','2026-01-07 10:32:32',NULL),(271,1,'2026-01-29',0,'2026-01-07 10:36:30','2026-01-07 10:36:30',NULL),(274,1,'2026-01-08',0,'2026-01-08 07:22:24','2026-01-08 07:22:24',NULL),(280,1,'2026-03-14',0,'2026-01-08 07:58:06','2026-01-08 07:58:06',NULL),(281,1,'2026-03-21',0,'2026-01-08 07:58:08','2026-01-08 07:58:08',NULL),(282,1,'2026-03-13',0,'2026-01-08 07:58:10','2026-01-08 07:58:10',NULL),(283,1,'2026-03-05',0,'2026-01-08 07:58:13','2026-01-08 07:58:13',NULL),(285,1,'2025-12-06',0,'2026-01-08 08:06:35','2026-01-08 08:06:35',NULL),(287,1,'2026-02-11',0,'2026-01-08 08:14:45','2026-01-08 08:14:45',NULL),(289,1,'2026-01-01',0,'2026-01-08 08:15:12','2026-01-08 08:15:12',NULL),(290,1,'2026-01-10',0,'2026-01-08 08:15:50','2026-01-08 08:15:50',NULL),(291,1,'2026-01-02',0,'2026-01-08 08:16:43','2026-01-08 08:16:43',NULL),(292,1,'2026-01-14',0,'2026-01-08 08:17:12','2026-01-08 08:17:12',NULL),(293,1,'2026-01-24',0,'2026-01-08 08:17:21','2026-01-08 08:17:21',NULL),(294,1,'2026-01-09',0,'2026-01-08 08:17:28','2026-01-08 08:17:28',NULL),(295,1,'2026-01-17',0,'2026-01-08 08:18:27','2026-01-08 08:18:27',NULL),(298,1,'2026-01-16',0,'2026-01-08 08:19:42','2026-01-08 08:19:42',NULL),(299,1,'2026-01-20',0,'2026-01-08 08:20:00','2026-01-08 08:20:00',NULL),(302,1,'2026-01-30',0,'2026-01-08 08:21:06','2026-01-08 08:21:06',NULL),(305,1,'2026-01-22',0,'2026-01-08 08:23:48','2026-01-08 08:23:48',NULL),(307,1,'2026-01-23',0,'2026-01-08 08:26:14','2026-01-08 08:26:14',NULL),(310,1,'2026-01-19',0,'2026-01-08 08:30:49','2026-01-08 08:30:49',NULL),(318,1,'2026-02-06',0,'2026-01-08 08:55:58','2026-01-08 08:55:58',NULL),(319,1,'2026-02-07',0,'2026-01-08 08:56:43','2026-01-08 08:56:43',NULL),(320,1,'2026-04-30',0,'2026-01-08 08:57:37','2026-01-08 08:57:37',NULL),(321,1,'2026-04-17',0,'2026-01-08 08:58:33','2026-01-08 08:58:33',NULL),(322,1,'2026-04-11',0,'2026-01-08 08:58:42','2026-01-08 08:58:42',NULL),(323,1,'2026-04-23',0,'2026-01-08 08:59:12','2026-01-08 08:59:12',NULL),(324,1,'2026-04-03',0,'2026-01-08 09:00:23','2026-01-08 09:00:23',NULL),(333,1,'2026-01-21',0,'2026-01-08 09:27:52','2026-01-08 09:27:52',NULL),(346,1,'2026-01-05',0,'2026-01-08 11:10:06','2026-01-08 11:10:06',NULL),(377,1,'2026-01-06',0,'2026-01-08 17:32:08','2026-01-08 17:32:08',NULL),(562,7,'2026-01-21',0,'2026-01-20 19:01:50','2026-01-20 19:01:50',NULL),(565,8,'2026-01-15',0,'2026-01-21 09:26:01','2026-01-21 09:26:01',NULL),(570,3,'2026-02-02',0,'2026-02-02 12:42:33','2026-02-02 12:42:33',0.00),(571,3,'2026-02-04',0,'2026-02-02 12:42:42','2026-02-02 12:42:42',0.00),(572,3,'2026-02-11',0,'2026-02-02 12:42:48','2026-02-02 12:42:48',0.00),(574,3,'2026-02-20',0,'2026-02-02 12:43:13','2026-02-02 12:43:13',0.00),(575,3,'2026-02-18',0,'2026-02-02 12:43:19','2026-02-02 12:43:19',0.00),(578,3,'2026-02-12',0,'2026-02-02 12:43:47','2026-02-02 12:43:47',0.00),(581,3,'2026-02-01',0,'2026-02-02 12:44:10','2026-02-02 12:44:10',0.00),(587,3,'2026-02-03',0,'2026-02-02 12:46:08','2026-02-02 12:46:08',0.00),(603,3,'2026-02-05',0,'2026-02-02 12:52:20','2026-02-02 12:52:20',0.00),(606,3,'2026-02-22',0,'2026-02-02 12:56:45','2026-02-02 12:56:45',0.00);
/*!40000 ALTER TABLE `daily_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diaries`
--

DROP TABLE IF EXISTS `diaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diaries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `canvasImagePath` varchar(255) DEFAULT NULL,
  `texts` json DEFAULT NULL,
  `images` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`date`),
  CONSTRAINT `diaries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diaries`
--

LOCK TABLES `diaries` WRITE;
/*!40000 ALTER TABLE `diaries` DISABLE KEYS */;
INSERT INTO `diaries` VALUES (33,3,'2026-02-02','rkske','/uploads/1770036982726_3.png','[]','[]','2026-02-02 12:09:10','2026-02-02 12:56:22');
/*!40000 ALTER TABLE `diaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `time` time DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `color` varchar(50) DEFAULT '#fffbe6',
  `completed` tinyint(1) DEFAULT '0',
  `setReminder` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `original_start_date` date DEFAULT NULL,
  `original_end_date` date DEFAULT NULL,
  `is_multi_day` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (27,2,'2026-02-01','ㅎㅎ',NULL,'personal','#fffbe6',1,0,'2026-01-28 07:31:58',NULL,NULL,0),(28,2,'2026-02-08','ㅎㅎ',NULL,'personal','#fffbe6',0,0,'2026-01-28 07:31:58',NULL,NULL,0),(29,2,'2026-02-15','ㅎㅎ',NULL,'personal','#fffbe6',0,0,'2026-01-28 07:31:58',NULL,NULL,0),(34,2,'2026-02-03','ㅎㅎ',NULL,'personal','#fffbe6',0,0,'2026-01-29 15:01:13',NULL,NULL,0),(37,2,'2026-01-30','ㅎㅎ',NULL,'personal','#FFA544',0,0,'2026-01-29 15:14:49',NULL,NULL,0),(38,2,'2026-01-30','하이루',NULL,'personal','#9DDBFF',0,0,'2026-01-29 15:15:04',NULL,NULL,0),(40,2,'2026-01-23','신기방기',NULL,'personal','#FFE79D',0,0,'2026-01-29 15:15:51',NULL,NULL,0),(44,2,'2026-02-01','교회',NULL,'personal','#A5A5A5',0,0,'2026-01-29 15:22:12',NULL,NULL,0),(45,2,'2026-02-08','교회',NULL,'personal','#A5A5A5',0,0,'2026-01-29 15:22:12',NULL,NULL,0),(46,2,'2026-02-15','교회',NULL,'personal','#A5A5A5',0,0,'2026-01-29 15:22:12',NULL,NULL,0),(47,2,'2026-02-22','교회',NULL,'personal','#A5A5A5',0,0,'2026-01-29 15:22:12',NULL,NULL,0),(48,2,'2026-03-01','교회',NULL,'personal','#A5A5A5',0,0,'2026-01-29 15:22:12',NULL,NULL,0),(49,2,'2026-03-08','교회',NULL,'personal','#A5A5A5',0,0,'2026-01-29 15:22:12',NULL,NULL,0),(51,2,'2026-01-24','ㅎㅎ',NULL,'personal','#FFA544',0,0,'2026-01-31 05:22:08',NULL,NULL,0),(52,2,'2026-01-20','dlfwjd',NULL,'personal','#9DDBFF',0,0,'2026-01-31 05:22:37',NULL,NULL,0),(57,2,'2026-01-23','ㅎㅎ','14:56:00','personal','#FFE79D',0,0,'2026-01-31 05:53:20',NULL,NULL,0),(61,2,'2026-01-26','QQQ',NULL,'personal','#A5A5A5',0,0,'2026-01-31 06:22:01',NULL,NULL,0),(62,2,'2026-01-26','신기방기',NULL,'personal','#9effe0',0,0,'2026-01-31 06:22:13',NULL,NULL,0),(63,2,'2026-01-26','ㅎㅎ',NULL,'personal','#FFA544',0,0,'2026-01-31 06:22:14',NULL,NULL,0),(64,2,'2026-01-26','QQQ',NULL,'personal','#FFE79D',0,1,'2026-01-31 06:25:32',NULL,NULL,0),(65,2,'2026-01-29','신기방기',NULL,'personal','#FFE79D',0,0,'2026-01-31 06:41:08',NULL,NULL,0),(73,2,'2026-01-08','ㅎㅎ',NULL,'personal','#FFE79D',0,0,'2026-01-31 07:36:22',NULL,NULL,0),(74,2,'2026-01-09','ㅎㅎ',NULL,'personal','#FFE79D',0,0,'2026-01-31 07:36:22',NULL,NULL,0),(75,2,'2026-01-01','신기방기',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:25:36','2026-01-01','2026-01-02',1),(76,2,'2026-01-20','QQQ',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:25:41','2026-01-20','2026-01-21',1),(77,2,'2026-01-03','ㅎㅎ',NULL,'personal','#FFA544',0,0,'2026-01-31 08:26:19',NULL,NULL,0),(78,2,'2026-01-20','신기방기',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:31:30','2026-01-20','2026-01-21',1),(79,2,'2026-01-14','신기방기',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:37:27','2026-01-14','2026-01-15',1),(80,2,'2026-01-15','QQQ',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:42:14','2026-01-15','2026-01-16',1),(81,2,'2026-02-09','QQQ',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:42:23','2026-02-09','2026-02-11',1),(82,2,'2026-01-06','QQQ',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:45:05','2026-01-06','2026-01-07',1),(83,2,'2026-01-16','QQQ',NULL,'personal','#FFE79D',0,0,'2026-01-31 08:51:52','2026-01-16','2026-01-17',1),(84,2,'2026-01-27','신기방기',NULL,'personal','#9effe0',0,0,'2026-01-31 08:52:19',NULL,NULL,0),(85,2,'2026-01-27','QQQ',NULL,'personal','#A5A5A5',0,0,'2026-01-31 08:52:20',NULL,NULL,0),(86,2,'2026-01-27','ㅎㅎ',NULL,'personal','#FFA544',0,0,'2026-01-31 08:52:21',NULL,NULL,0),(87,2,'2026-01-13','ㅔㅔ','11:00:00','personal','#9DDBFF',0,0,'2026-01-31 09:35:16','2026-01-13','2026-01-14',1),(88,2,'2026-01-13','ㅏㅏ','07:35:00','personal','#FFE79D',0,0,'2026-01-31 09:35:44','2026-01-13','2026-01-14',1),(89,2,'2026-01-10','QQQ',NULL,'personal','#FFE79D',0,0,'2026-01-31 14:57:51',NULL,NULL,0),(90,2,'2026-02-13','신기방기',NULL,'personal','#9effe0',1,0,'2026-01-31 15:12:34',NULL,NULL,0),(91,2,'2026-02-18','신기방기',NULL,'personal','#FFE79D',0,0,'2026-01-31 15:13:11',NULL,NULL,0),(92,2,'2026-02-19','신기방기',NULL,'personal','#FFE79D',0,0,'2026-01-31 15:13:11',NULL,NULL,0),(93,2,'2026-02-25','신기방기',NULL,'personal','#FFE79D',0,0,'2026-02-01 11:08:38',NULL,NULL,0),(94,2,'2026-02-26','신기방기',NULL,'personal','#FFE79D',0,0,'2026-02-01 11:08:38',NULL,NULL,0),(96,2,'2026-02-27','QQQ',NULL,'personal','#FFE79D',0,0,'2026-02-01 12:06:34',NULL,NULL,0),(98,2,'2026-02-10','ㅎㅎ',NULL,'personal','#FFE79D',0,0,'2026-02-01 12:10:25',NULL,NULL,0),(99,2,'2026-02-11','ㅎㅎ',NULL,'personal','#FFE79D',0,0,'2026-02-01 12:10:25',NULL,NULL,0),(100,2,'2026-02-20','ㅎㅎ',NULL,'personal','#FFE79D',0,0,'2026-02-01 12:16:48',NULL,NULL,0),(101,2,'2026-02-21','ㅎㅎ',NULL,'personal','#FFE79D',0,0,'2026-02-01 12:16:48',NULL,NULL,0),(102,2,'2026-02-06','ㅁㅁ',NULL,'personal','#A5A5A5',0,0,'2026-02-01 12:23:09',NULL,NULL,0),(103,2,'2026-02-07','ㅁㅁ',NULL,'personal','#A5A5A5',0,0,'2026-02-01 12:23:09',NULL,NULL,0);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meal_foods`
--

DROP TABLE IF EXISTS `meal_foods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_foods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `meal_id` int(11) NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `calories` decimal(10,2) NOT NULL,
  `carbs` decimal(10,2) NOT NULL,
  `protein` decimal(10,2) NOT NULL,
  `fat` decimal(10,2) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meal_id` (`meal_id`),
  CONSTRAINT `meal_foods_ibfk_1` FOREIGN KEY (`meal_id`) REFERENCES `meals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meal_foods`
--

LOCK TABLES `meal_foods` WRITE;
/*!40000 ALTER TABLE `meal_foods` DISABLE KEYS */;
INSERT INTO `meal_foods` VALUES (33,39,'현미밥',321.00,71.00,6.50,1.00,1.00,'2026-02-02 12:52:53');
/*!40000 ALTER TABLE `meal_foods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meals`
--

DROP TABLE IF EXISTS `meals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `category` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`date`,`category`),
  CONSTRAINT `meals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meals`
--

LOCK TABLES `meals` WRITE;
/*!40000 ALTER TABLE `meals` DISABLE KEYS */;
INSERT INTO `meals` VALUES (39,3,'2026-02-02','간식','2026-02-02 12:52:53','2026-02-02 12:52:53');
/*!40000 ALTER TABLE `meals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menstrual_cycles`
--

DROP TABLE IF EXISTS `menstrual_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menstrual_cycles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `menstrual_cycles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menstrual_cycles`
--

LOCK TABLES `menstrual_cycles` WRITE;
/*!40000 ALTER TABLE `menstrual_cycles` DISABLE KEYS */;
INSERT INTO `menstrual_cycles` VALUES (3,2,'2026-01-14','2026-01-19','2026-02-01 10:43:28'),(4,2,'2025-12-14','2025-12-20','2026-02-01 10:43:42');
/*!40000 ALTER TABLE `menstrual_cycles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menstrual_predictions`
--

DROP TABLE IF EXISTS `menstrual_predictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menstrual_predictions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `predicted_start_date` date NOT NULL,
  `predicted_end_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `menstrual_predictions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menstrual_predictions`
--

LOCK TABLES `menstrual_predictions` WRITE;
/*!40000 ALTER TABLE `menstrual_predictions` DISABLE KEYS */;
/*!40000 ALTER TABLE `menstrual_predictions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stopwatch_categories`
--

DROP TABLE IF EXISTS `stopwatch_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stopwatch_categories` (
  `user_id` int(11) NOT NULL,
  `data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stopwatch_categories`
--

LOCK TABLES `stopwatch_categories` WRITE;
/*!40000 ALTER TABLE `stopwatch_categories` DISABLE KEYS */;
INSERT INTO `stopwatch_categories` VALUES (3,'[{\"name\": \"공부\", \"color\": \"#FFC0CB\"}, {\"name\": \"운동\", \"color\": \"#FFD700\"}, {\"name\": \"취미\", \"color\": \"#ADD8E6\"}, {\"name\": \"알바\", \"color\": \"#90EE90\"}, {\"name\": \"ㅓ\", \"color\": \"#FFC0CB\"}]','2026-02-02 12:42:37','2026-02-02 12:49:05');
/*!40000 ALTER TABLE `stopwatch_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stopwatch_records`
--

DROP TABLE IF EXISTS `stopwatch_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stopwatch_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `tasks_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`date`),
  CONSTRAINT `stopwatch_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=241 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stopwatch_records`
--

LOCK TABLES `stopwatch_records` WRITE;
/*!40000 ALTER TABLE `stopwatch_records` DISABLE KEYS */;
INSERT INTO `stopwatch_records` VALUES (73,3,'2026-02-25','[]','2026-02-02 12:34:26','2026-02-02 12:34:26'),(75,3,'2026-02-03','[]','2026-02-02 12:34:32','2026-02-02 12:46:09'),(76,3,'2026-02-02','[{\"id\": 1770036487483, \"color\": \"#FFC0CB\", \"category\": \"ㅓ\", \"isPaused\": true, \"isComplete\": true, \"elapsedTime\": 5000}, {\"id\": 1770036493618, \"color\": \"#FFD700\", \"category\": \"ㅣ\", \"isPaused\": true, \"isComplete\": false, \"elapsedTime\": 1000}]','2026-02-02 12:34:34','2026-02-02 12:48:26'),(80,3,'2026-02-04','[]','2026-02-02 12:34:39','2026-02-02 12:42:43'),(91,3,'2026-02-19','[]','2026-02-02 12:42:39','2026-02-02 12:43:06'),(95,3,'2026-02-11','[]','2026-02-02 12:42:44','2026-02-02 12:43:10'),(96,3,'2026-02-18','[]','2026-02-02 12:42:44','2026-02-02 12:45:48'),(97,3,'2026-02-27','[]','2026-02-02 12:42:45','2026-02-02 12:42:45'),(98,3,'2026-02-26','[]','2026-02-02 12:42:45','2026-02-02 12:42:45'),(99,3,'2026-02-24','[{\"id\": 1770035674037, \"color\": \"#FFC0CB\", \"category\": \"d\", \"isPaused\": true, \"isComplete\": true, \"elapsedTime\": 2000}, {\"id\": 1770036175597, \"color\": \"#FFC0CB\", \"category\": \"ㅓ\", \"isPaused\": true, \"isComplete\": true, \"elapsedTime\": 3000}]','2026-02-02 12:42:46','2026-02-02 12:43:41'),(102,3,'2026-02-17','[]','2026-02-02 12:42:51','2026-02-02 12:42:51'),(114,3,'2026-02-06','[]','2026-02-02 12:43:07','2026-02-02 12:43:07'),(115,3,'2026-02-10','[]','2026-02-02 12:43:08','2026-02-02 12:43:08'),(118,3,'2026-02-20','[]','2026-02-02 12:43:13','2026-02-02 12:43:13'),(123,3,'2026-02-16','[]','2026-02-02 12:43:17','2026-02-02 12:43:17'),(136,3,'2026-02-23','[]','2026-02-02 12:43:41','2026-02-02 12:43:41'),(146,3,'2026-02-05','[{\"id\": 1770036340606, \"color\": \"#FFC0CB\", \"category\": \"ㅓ\", \"isPaused\": false, \"isComplete\": false, \"elapsedTime\": 42000}, {\"id\": 1770036344444, \"color\": \"#FFD700\", \"category\": \"ㅣ\", \"isPaused\": true, \"isComplete\": true, \"elapsedTime\": 2000}]','2026-02-02 12:43:54','2026-02-02 12:52:44'),(148,3,'2026-02-09','[]','2026-02-02 12:43:55','2026-02-02 12:43:55'),(151,3,'2026-02-12','[]','2026-02-02 12:43:57','2026-02-02 12:43:57'),(152,3,'2026-02-13','[]','2026-02-02 12:43:58','2026-02-02 12:43:58'),(159,3,'2026-02-01','[]','2026-02-02 12:44:10','2026-02-02 12:44:10'),(215,3,'2026-02-15','[]','2026-02-02 12:48:30','2026-02-02 12:48:30'),(225,3,'2026-02-14','[]','2026-02-02 12:49:07','2026-02-02 12:49:07'),(239,3,'2026-02-08','[]','2026-02-02 12:52:51','2026-02-02 12:52:51');
/*!40000 ALTER TABLE `stopwatch_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `color` varchar(50) DEFAULT '#FFE79D',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES (3,2,'공부','todo','#FFA544','2026-01-28 07:27:09'),(4,2,'ㅎㅎ','schedule','#FFA544','2026-01-28 07:27:27'),(5,2,'신기방기','schedule','#9effe0','2026-01-29 15:15:48'),(6,2,'QQQ','schedule','#A5A5A5','2026-01-31 06:21:53');
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `todos`
--

DROP TABLE IF EXISTS `todos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `todos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT '#fffbe6',
  `completed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `todos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `todos`
--

LOCK TABLES `todos` WRITE;
/*!40000 ALTER TABLE `todos` DISABLE KEYS */;
INSERT INTO `todos` VALUES (3,2,'2026-02-01','공부','#FFA544',0,'2026-01-31 15:13:21');
/*!40000 ALTER TABLE `todos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `weight` decimal(5,2) DEFAULT NULL,
  `target_calories` int(11) DEFAULT NULL,
  `stopwatch_categories` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'김제니s','yns2017@naver.com','$2b$10$EaKhjnIwzIXWKzFiDeIm4.eeAcAe59AsvcK6BS0I3IXho49lqOVkW','/uploads/1765543842915.jpeg','2025-12-11 04:51:55',47.00,NULL,NULL),(2,'14','14@14.com','$2b$10$U1QjVZy7wTbZsgfwjmdGsu567VC1M7y8HoiHACVACamp11YjwBrES','/uploads/1769947631569.png','2026-01-28 07:03:14',NULL,NULL,NULL),(3,'na','yns2017@gmail.com','$2b$10$ep3AwdvzHgv/ZDYVeRrQpuoapmjQLPZMsIhHiY/fnasGj4dYZrs9u','/uploads/1770034112515.png','2026-02-02 12:08:22',50.00,NULL,NULL);
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

-- Dump completed on 2026-02-02 22:00:15

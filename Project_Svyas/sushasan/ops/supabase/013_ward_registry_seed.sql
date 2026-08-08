-- 013_ward_registry_seed.sql — seed all 58 real PMC wards into `wards`.
--
-- 001_init.sql only ever seeded 8 (the original pilot set). Every intake
-- path now resolves ward_id against the full 58-ward registry in
-- apps/web/lib/wards.ts (see that file's header for why), but posts,
-- clusters, and solutions for the other 50 wards had nowhere to join
-- against for name/tier/budget metadata — the gov dashboard and citizen
-- dashboard would show a bare ward number with no name for any of them.
--
-- Names, ward_number, and tier come from the same source as lib/wards.ts:
-- the real PMC ward boundaries in public/geojson/{wards-pilot,wards-context}
-- .geojson. On conflict, only name/ward_number/tier are refreshed —
-- corporator_name/party/contact/annual_budget_inr are left untouched if an
-- admin has already filled them in for a ward.

INSERT INTO wards (id, name, ward_number, tier)
VALUES
  ('1', 'Dhanori - Vishrantwadi', 1, 'context'),
  ('2', 'Tingrenagar - Sanjay Park', 2, 'context'),
  ('3', 'Lohegaon - Vimannagar', 3, 'context'),
  ('4', 'East Kharadi - Wagholi', 4, 'context'),
  ('5', 'West Kharadi - Vadgaon Sheri', 5, 'context'),
  ('6', 'Vadgaon Sheri - Ramwadi', 6, 'context'),
  ('7', 'Kalyaninagar - Nagpur Chawl', 7, 'context'),
  ('8', 'Kalas - Phulenagar', 8, 'context'),
  ('9', 'Yerwada', 9, 'context'),
  ('10', 'Shivajinagar Gaothan - Sangamwadi', 10, 'context'),
  ('11', 'Bopodi - Savitribai Phule Pune University', 11, 'context'),
  ('12', 'Aundh - Balewadi', 12, 'context'),
  ('13', 'Baner - Sus - Mahalunge', 13, 'context'),
  ('14', 'Pashan - Bawdhan', 14, 'context'),
  ('15', 'Gokhalenagar - Vadarwadi', 15, 'context'),
  ('16', 'Fergusson College - Erandwane', 16, 'context'),
  ('17', 'Shaniwar peth - Navi Peth', 17, 'context'),
  ('18', 'Shaniwarwada - Kasba Peth', 18, 'context'),
  ('19', 'Chhatrapati Shivaji Maharaj Stadium - Rasta peth', 19, 'context'),
  ('20', 'Pune Station -Matoshri Ramabai Ambedkar Road', 20, 'context'),
  ('21', 'Koregaon park - Mundhwa', 21, 'context'),
  ('22', 'Manjari Bk. - Shewalwadi', 22, 'context'),
  ('23', 'Sadesataranali - Aakashwani', 23, 'context'),
  ('24', 'Magarpatta - Sadhana Vidyalaya', 24, 'context'),
  ('25', 'Hadapsar Gaothan - Satavwadi', 25, 'pilot'),
  ('26', 'Wanwadi Gaothan - Vaiduwadi', 26, 'pilot'),
  ('27', 'Kasewadi - Lohiyanagar', 27, 'context'),
  ('28', 'Mahatma Phule Smarak –Bhavani Peth', 28, 'context'),
  ('29', 'Ghorpade peth Udyan - Mahatma Phule Mandai', 29, 'context'),
  ('30', 'Jai Bhavaninagar - Kelewadi', 30, 'context'),
  ('31', 'Kothrud Gaothan - Shivtirthnagar', 31, 'context'),
  ('32', 'Bhusari colony - Bavdhan Khurd', 32, 'context'),
  ('33', 'Ideal colony - Mahatma Society', 33, 'context'),
  ('34', 'Warje - Kondhave Dhavde', 34, 'context'),
  ('35', 'Ramnagar - Uttamnagar Shivane', 35, 'context'),
  ('36', 'Karvenagar', 36, 'context'),
  ('37', 'Janata Vasahat - Dattawadi', 37, 'context'),
  ('38', 'Shivdarshan - Padmavati', 38, 'context'),
  ('39', 'Market yard - Maharshinagar', 39, 'context'),
  ('40', 'Bibvewadi - Gangadham', 40, 'context'),
  ('41', 'Kondhva Kh - Mithanagar', 41, 'pilot'),
  ('42', 'Ramtekadi - Sayyadnagar', 42, 'pilot'),
  ('43', 'Wanawadi - Kausar Baug', 43, 'pilot'),
  ('44', 'Kale Boratenagar - Sasanenagar', 44, 'pilot'),
  ('45', 'Fursungi', 45, 'context'),
  ('46', 'Mohammad wadi - Uruli Devachi', 46, 'pilot'),
  ('47', 'Kondhva Bk - Yewalewadi', 47, 'pilot'),
  ('48', 'Upper Super Indiranagar', 48, 'context'),
  ('49', 'Balajinagar - Shankar Maharaj Math', 49, 'context'),
  ('50', 'Sahakarnagar - Taljai', 50, 'context'),
  ('51', 'Vadgaon Bk - Manikbaug', 51, 'context'),
  ('52', 'Nanded City - Sun City', 52, 'context'),
  ('53', 'Khadakwasla - Narhe', 53, 'context'),
  ('54', 'Dhayari - Ambegaon', 54, 'context'),
  ('55', 'Dhankawadi - Ambegaon Pathar', 55, 'context'),
  ('56', 'Chaitanyanagar - Bharati Vidyapeeth', 56, 'context'),
  ('57', 'Sukhsagarnagar - Rajiv Gandhinagar', 57, 'context'),
  ('58', 'Katraj - Gokulnagar', 58, 'context')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ward_number = EXCLUDED.ward_number,
  tier = EXCLUDED.tier;

-- The school's id in myispp.com's school data (/data/master.json schoolId); NULL means not linked.
ALTER TABLE schools ADD COLUMN ispp_school_id TEXT;

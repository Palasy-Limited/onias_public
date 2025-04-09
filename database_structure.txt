Table: apartments

Columns:
apartment_id int AI PK
property_id int
apartment_number varchar(10)
apartment_type enum('studio','one_bedroom','two_bedroom','three_bedroom')
switch_name varchar(10)
port_number int

Table: internet_plans

Columns:
plan_id int AI PK
speed varchar(10)
price decimal(10,2)
is_default tinyint(1)

Table: maintenance

Columns:
maintenance_id int AI PK
apartment_id int
request_date date
description text
status enum('Pending','In Progress','Completed','Cancelled')
completed_date date
priority enum('Low','Medium','High')
assigned_to varchar(100)
cost decimal(10,2)
notes text

Table: payments

Columns:
payment_id int AI PK
tenancy_id int
payment_type_id int
payment_date date
amount_paid decimal(10,2)
for_month date


Table: payment_types

Columns:
payment_type_id int AI PK
type_name varchar(20)

Table: properties

Columns:
property_id int AI PK
name varchar(100)
address varchar(255)
description text
conservancy_fee decimal(10,2)
water_rate_per_unit decimal(10,2)



Table: tenancies

Columns:
tenancy_id int AI PK
apartment_id int
tenant_id int
start_date date
end_date date
rent_amount decimal(10,2)
deposit_amount decimal(10,2)
internet_plan_id int
active tinyint(1)
final_balance decimal(10,2)

Table: tenants 
Columns:
tenant_id int AI PK
name varchar(100)
id_passport_number varchar(20)
contact varchar(15)
email varchar(100)
emergency_contact_name varchar(100)
emergency_contact_phone varchar(15)

Table: vehicles

Columns:
vehicle_id int AI PK
tenant_id int
make varchar(50)
model varchar(50)
license_plate varchar(20)
color varchar(20)
parking_spot varchar(10)

Table: water_meters

Columns:
water_meter_id int AI PK
apartment_id int
meter_number varchar(20)

Table: water_readings

Columns:
reading_id int AI PK
water_meter_id int
reading_date date
current_reading decimal(10,2)


# Views

View: active_tenancies

Columns:
tenancy_id int
start_date date
end_date date
rent_amount decimal(10,2)
deposit_amount decimal(10,2)
final_balance decimal(10,2)
apartment_id int
apartment_number varchar(10)
apartment_type enum('studio','one_bedroom','two_bedroom','three_bedroom')
property_id int
property_name varchar(100)
tenant_id int
tenant_name varchar(100)
contact varchar(15)
email varchar(100)

View: apartment_details

Columns:
apartment_id int
apartment_number varchar(10)
apartment_type
enum('studio','one_bedroom','two_bedroom','three_bedroom')
property_id int
property_name varchar(100)
address varchar(255)
description text
conservancy_fee decimal(10,2)

View: tenancy_internet_plans

Columns:
tenancy_id int
apartment_id int
tenant_id int
plan_id int
speed varchar(10)
price decimal(10,2)
is_default tinyint(1)

View: tenant_move_history

Columns:
tenancy_id int
tenant_name varchar(100)
apartment_number varchar(10)
property_name varchar(100)
move_in_date date
move_out_date date
tenancy_status varchar(9)


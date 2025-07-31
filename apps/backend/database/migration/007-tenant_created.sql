ALTER TABLE tenants
ADD COLUMN created_by UUID REFERENCES users(id);

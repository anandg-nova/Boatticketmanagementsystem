"""initial migration

Revision ID: initial
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for user roles
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'ride_manager', 'customer')")
    
    # Create user table
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', postgresql.ENUM('admin', 'ride_manager', 'customer', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)
    op.create_index(op.f('ix_user_id'), 'user', ['id'], unique=False)

    # Create pier table
    op.create_table(
        'pier',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pier_id'), 'pier', ['id'], unique=False)
    op.create_index(op.f('ix_pier_name'), 'pier', ['name'], unique=True)

    # Create boat table
    op.create_table(
        'boat',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('pier_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pier_id'], ['pier.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_boat_id'), 'boat', ['id'], unique=False)
    op.create_index(op.f('ix_boat_name'), 'boat', ['name'], unique=True)

    # Create timeslot table
    op.create_table(
        'timeslot',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('max_capacity', sa.Integer(), nullable=False),
        sa.Column('boat_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['boat_id'], ['boat.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_timeslot_id'), 'timeslot', ['id'], unique=False)

    # Create ride table
    op.create_table(
        'ride',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('boat_id', sa.Integer(), nullable=False),
        sa.Column('timeslot_id', sa.Integer(), nullable=False),
        sa.Column('ride_manager_id', sa.Integer(), nullable=False),
        sa.Column('departure_time', sa.DateTime(), nullable=True),
        sa.Column('return_time', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['boat_id'], ['boat.id'], ),
        sa.ForeignKeyConstraint(['ride_manager_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['timeslot_id'], ['timeslot.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ride_id'), 'ride', ['id'], unique=False)

    # Create booking table
    op.create_table(
        'booking',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('ride_id', sa.Integer(), nullable=False),
        sa.Column('number_of_tickets', sa.Integer(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('payment_status', sa.String(), nullable=False),
        sa.Column('booking_status', sa.String(), nullable=False),
        sa.Column('qr_code_path', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['ride_id'], ['ride.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_booking_id'), 'booking', ['id'], unique=False)


def downgrade() -> None:
    # Drop all tables
    op.drop_index(op.f('ix_booking_id'), table_name='booking')
    op.drop_table('booking')
    
    op.drop_index(op.f('ix_ride_id'), table_name='ride')
    op.drop_table('ride')
    
    op.drop_index(op.f('ix_timeslot_id'), table_name='timeslot')
    op.drop_table('timeslot')
    
    op.drop_index(op.f('ix_boat_name'), table_name='boat')
    op.drop_index(op.f('ix_boat_id'), table_name='boat')
    op.drop_table('boat')
    
    op.drop_index(op.f('ix_pier_name'), table_name='pier')
    op.drop_index(op.f('ix_pier_id'), table_name='pier')
    op.drop_table('pier')
    
    op.drop_index(op.f('ix_user_id'), table_name='user')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
    
    # Drop enum type
    op.execute('DROP TYPE userrole') 
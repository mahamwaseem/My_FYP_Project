"""
Migration 0003 — Link VoucherDetail to real COA Account

What this does:
  1. Drops the old dummy `account_id` IntegerField
  2. Adds a real ForeignKey to accounts.Account
  3. Also renames the DB indexes that referenced account_id

IMPORTANT: Run this AFTER both apps' earlier migrations have been applied.
  python manage.py migrate accounts   (runs 0001–0007)
  python manage.py migrate vouchers   (runs 0001–0002, then this 0003)

If you already have data in fin_voucher_detail with account_id values,
those integers must match existing rows in the Accounts table.
If your DB is empty / dev-only, just run migrate normally.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_account'),          # accounts app must be migrated first
        ('vouchers', '0002_voucherauditlog_and_more'),
    ]

    operations = [
        # 1. Drop old indexes that reference account_id column
        migrations.RemoveIndex(
            model_name='voucherdetail',
            name='idx_vd_account',
        ),
        migrations.RemoveIndex(
            model_name='voucherdetail',
            name='idx_vd_account_header',
        ),

        # 2. Remove the dummy IntegerField
        migrations.RemoveField(
            model_name='voucherdetail',
            name='account_id',
        ),

        # 3. Add the real FK to accounts.Account
        migrations.AddField(
            model_name='voucherdetail',
            name='account',
            field=models.ForeignKey(
                help_text='Select from Chart of Accounts',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='voucher_lines',
                to='accounts.account',
                # null=True only during migration; we'll make it required below
                null=True,
            ),
            preserve_default=False,
        ),

        # 4. Once the column exists, make it non-nullable
        migrations.AlterField(
            model_name='voucherdetail',
            name='account',
            field=models.ForeignKey(
                help_text='Select from Chart of Accounts',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='voucher_lines',
                to='accounts.account',
            ),
        ),

        # 5. Re-create indexes on the new FK column
        migrations.AddIndex(
            model_name='voucherdetail',
            index=models.Index(fields=['account'], name='idx_vd_account'),
        ),
        migrations.AddIndex(
            model_name='voucherdetail',
            index=models.Index(fields=['account', 'header'], name='idx_vd_account_header'),
        ),
    ]

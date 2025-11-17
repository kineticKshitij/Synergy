# Generated migration for OTP fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_userprofile_department_userprofile_position'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='otp_code',
            field=models.CharField(blank=True, help_text='6-digit OTP code', max_length=6, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='otp_created_at',
            field=models.DateTimeField(blank=True, help_text='When OTP was generated', null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='otp_attempts',
            field=models.IntegerField(default=0, help_text='Number of failed OTP verification attempts'),
        ),
    ]

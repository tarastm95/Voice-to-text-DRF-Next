# Generated by Django 5.1.4 on 2024-12-20 01:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='clerk_id',
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
    ]

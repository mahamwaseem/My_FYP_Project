"""
FinTrack — Reports serializers
Inputs are plain dicts produced by services.py (not model instances), so these
are plain Serializers used for shaping/validation of the response only.
"""
from rest_framework import serializers


class LineSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    code = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=20, decimal_places=2)
    prior = serializers.DecimalField(max_digits=20, decimal_places=2, required=False)


class TrialRowSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    code = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField()
    type = serializers.CharField(required=False)
    debit = serializers.DecimalField(max_digits=20, decimal_places=2)
    credit = serializers.DecimalField(max_digits=20, decimal_places=2)

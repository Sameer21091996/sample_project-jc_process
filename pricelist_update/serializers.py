from rest_framework import serializers
from .models import PricelistUpdateHdr, PricelistUpdateLine

class PricelistUpdateHdrSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricelistUpdateHdr
        fields = '__all__'


class PricelistUpdateLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricelistUpdateLine
        fields = '__all__'
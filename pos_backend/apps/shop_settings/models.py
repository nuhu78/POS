from django.db import models


class ShopSettings(models.Model):
    shop_name = models.CharField(max_length=150, default="My Shop")
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="BDT")
    receipt_footer = models.TextField(blank=True, default="")

    class Meta:
        verbose_name_plural = "Shop settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return self.shop_name

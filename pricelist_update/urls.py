from django.urls import path, include
from .views import *
from rest_framework import routers


app_name = "pricelist"
router = routers.DefaultRouter()
router.register(
    r"pricelist_data_list",
    PricelistUpdateHdrViewSet,
    basename="pricelist_data_list",
)

urlpatterns = [
    path("api/", include(router.urls)),
    
    path("lovs/", lovs, name='lovs'),
    
    path("", PricelistUpdateIndexView.as_view(), name="pricelist-index"),
    path("add/", PriceListAddView.as_view(), name="pricelist-create"),
    path("update/<str:batch_id>/", PriceListUpdateView.as_view(), name="pricelist-update-view"),
    path("api/search_pricelist_items", search_pricelist_items, name="search_pricelist_items"),
    path("api/create/", PriceListCreateAPI.as_view(), name="pricelist-create-api"),
    path("api/status-update/", PriceListStatusUpdateAPI.as_view(), name="pricelist-status-update"),

]

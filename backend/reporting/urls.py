"""
FinTrack — Reporting URL routes.
Paths match the frontend service layer (reportingApi.js) exactly.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('account-balances/',    views.AccountBalancesView.as_view(),    name='reporting-balances'),
    path('transaction-summary/', views.TransactionSummaryView.as_view(), name='reporting-txns'),
    path('audit-trail/',         views.AuditTrailView.as_view(),         name='reporting-audit'),
    path('account-statement/',   views.AccountStatementView.as_view(),   name='reporting-account'),
    path('custom-summary/',      views.CustomSummaryView.as_view(),      name='reporting-summary'),

    # generic export: /api/reporting/<report>/export/?format=csv|json
    path('<str:report>/export/', views.report_export,                   name='reporting-export'),
]

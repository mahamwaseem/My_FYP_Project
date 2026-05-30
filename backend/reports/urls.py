"""
FinTrack — Reports URLs  (mounted at /api/reports/ in config/urls.py)
These paths match the frontend service layer (statementsApi.js) exactly.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('summary/',          views.SummaryView.as_view(),         name='reports-summary'),
    path('balance-sheet/',    views.BalanceSheetView.as_view(),    name='reports-balance-sheet'),
    path('income-statement/', views.IncomeStatementView.as_view(), name='reports-income-statement'),
    path('cash-flow/',        views.CashFlowView.as_view(),        name='reports-cash-flow'),
    path('trial-balance/',    views.TrialBalanceView.as_view(),    name='reports-trial-balance'),
    # CSV/JSON export for any statement
    path('<str:statement>/export/', views.StatementExportView.as_view(), name='reports-export'),
]

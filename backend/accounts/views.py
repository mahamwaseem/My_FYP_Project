# accounts/views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import AccountGroup, AccountCategory, AccountClass, Account
from .serializers import AccountGroupSerializer, AccountCategorySerializer, AccountClassSerializer, AccountSerializer

# Role-based access control (Authentication & RBAC module).
# JWTUserAuthentication resolves the Bearer token to a FinTrack user.
# ReadOnlyOrAccounting: any signed-in user may GET (read); only admin +
# accountant may POST/PUT/PATCH/DELETE (write). Viewers get 403 on writes.
from users.auth import JWTUserAuthentication
from users.permissions import ReadOnlyOrAccounting

# Central system-wide audit trail.
from audit.services import record as audit_record
from audit.models import AuditAction


class AccountGroupListCreateView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request):
        try:
            groups = AccountGroup.objects.all()
            serializer = AccountGroupSerializer(groups, many=True)
            return Response({"success": True, "data": serializer.data, "count": groups.count()})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = AccountGroupSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.CREATED, "group", request=request,
                             entity_id=serializer.data.get("id", ""),
                             entity_label=str(serializer.data.get("name") or ""),
                             note="Group created.")
                return Response({"success": True, "message": "Account group created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountGroupDetailView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request, pk):
        group = get_object_or_404(AccountGroup, pk=pk)
        return Response({"success": True, "data": AccountGroupSerializer(group).data})

    def put(self, request, pk):
        try:
            group = get_object_or_404(AccountGroup, pk=pk)
            serializer = AccountGroupSerializer(group, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.UPDATED, "group", request=request,
                             entity_id=pk, entity_label=str(serializer.data.get("name") or ""),
                             note="Group updated.")
                return Response({"success": True, "message": "Updated.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            group = get_object_or_404(AccountGroup, pk=pk)
            name = group.name
            group.delete()
            audit_record(AuditAction.DELETED, "group", request=request,
                         entity_id=pk, entity_label=str(name), note="Group deleted.")
            return Response({"success": True, "message": f"Group '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountCategoryListCreateView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request):
        try:
            cats = AccountCategory.objects.select_related('group').all()
            serializer = AccountCategorySerializer(cats, many=True)
            return Response({"success": True, "data": serializer.data, "count": cats.count()})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = AccountCategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.CREATED, "category", request=request,
                             entity_id=serializer.data.get("id", ""),
                             entity_label=str(serializer.data.get("name") or ""),
                             note="Category created.")
                return Response({"success": True, "message": "Category created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountCategoryDetailView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request, pk):
        cat = get_object_or_404(AccountCategory, pk=pk)
        return Response({"success": True, "data": AccountCategorySerializer(cat).data})

    def put(self, request, pk):
        try:
            cat = get_object_or_404(AccountCategory, pk=pk)
            serializer = AccountCategorySerializer(cat, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.UPDATED, "category", request=request,
                             entity_id=pk, entity_label=str(serializer.data.get("name") or ""),
                             note="Category updated.")
                return Response({"success": True, "message": "Category updated successfully.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            cat = get_object_or_404(AccountCategory, pk=pk)
            name = cat.name
            cat.delete()
            audit_record(AuditAction.DELETED, "category", request=request,
                         entity_id=pk, entity_label=str(name), note="Category deleted.")
            return Response({"success": True, "message": f"Category '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountClassListCreateView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request):
        try:
            classes = AccountClass.objects.select_related('category__group').all()
            serializer = AccountClassSerializer(classes, many=True)
            return Response({"success": True, "data": serializer.data, "count": classes.count()})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = AccountClassSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.CREATED, "class", request=request,
                             entity_id=serializer.data.get("id", ""),
                             entity_label=str(serializer.data.get("name") or ""),
                             note="Class created.")
                return Response({"success": True, "message": "Class created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountClassDetailView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request, pk):
        cls = get_object_or_404(AccountClass, pk=pk)
        return Response({"success": True, "data": AccountClassSerializer(cls).data})

    def put(self, request, pk):
        try:
            cls = get_object_or_404(AccountClass, pk=pk)
            serializer = AccountClassSerializer(cls, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.UPDATED, "class", request=request,
                             entity_id=pk, entity_label=str(serializer.data.get("name") or ""),
                             note="Class updated.")
                return Response({"success": True, "message": "Class updated successfully.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            cls = get_object_or_404(AccountClass, pk=pk)
            name = cls.name
            cls.delete()
            audit_record(AuditAction.DELETED, "class", request=request,
                         entity_id=pk, entity_label=str(name), note="Class deleted.")
            return Response({"success": True, "message": f"Class '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── NEW ────────────────────────────────────────────────────────
class AccountListCreateView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request):
        try:
            accounts = Account.objects.select_related('account_class__category__group').all()
            serializer = AccountSerializer(accounts, many=True)
            return Response({"success": True, "data": serializer.data, "count": accounts.count()})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = AccountSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.CREATED, "account", request=request,
                             entity_id=serializer.data.get("id", ""),
                             entity_label=str(serializer.data.get("name") or ""),
                             note="Account created.")
                return Response({"success": True, "message": "Account created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountDetailView(APIView):
    authentication_classes = [JWTUserAuthentication]
    permission_classes = [ReadOnlyOrAccounting]

    def get(self, request, pk):
        account = get_object_or_404(Account, pk=pk)
        return Response({"success": True, "data": AccountSerializer(account).data})

    def put(self, request, pk):
        try:
            account    = get_object_or_404(Account, pk=pk)
            serializer = AccountSerializer(account, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                audit_record(AuditAction.UPDATED, "account", request=request,
                             entity_id=pk, entity_label=str(serializer.data.get("name") or ""),
                             note="Account updated.")
                return Response({"success": True, "message": "Account updated successfully.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            account = get_object_or_404(Account, pk=pk)
            name    = account.name
            account.delete()
            audit_record(AuditAction.DELETED, "account", request=request,
                         entity_id=pk, entity_label=str(name), note="Account deleted.")
            return Response({"success": True, "message": f"Account '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
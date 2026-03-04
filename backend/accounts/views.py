# accounts/views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import AccountGroup, AccountCategory, AccountClass, Account
from .serializers import AccountGroupSerializer, AccountCategorySerializer, AccountClassSerializer, AccountSerializer


class AccountGroupListCreateView(APIView):
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
                return Response({"success": True, "message": "Account group created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountGroupDetailView(APIView):
    def get(self, request, pk):
        group = get_object_or_404(AccountGroup, pk=pk)
        return Response({"success": True, "data": AccountGroupSerializer(group).data})

    def put(self, request, pk):
        try:
            group = get_object_or_404(AccountGroup, pk=pk)
            serializer = AccountGroupSerializer(group, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"success": True, "message": "Updated.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            group = get_object_or_404(AccountGroup, pk=pk)
            name = group.name
            group.delete()
            return Response({"success": True, "message": f"Group '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountCategoryListCreateView(APIView):
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
                return Response({"success": True, "message": "Category created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountCategoryDetailView(APIView):
    def get(self, request, pk):
        cat = get_object_or_404(AccountCategory, pk=pk)
        return Response({"success": True, "data": AccountCategorySerializer(cat).data})

    def put(self, request, pk):
        try:
            cat = get_object_or_404(AccountCategory, pk=pk)
            serializer = AccountCategorySerializer(cat, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"success": True, "message": "Category updated successfully.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            cat = get_object_or_404(AccountCategory, pk=pk)
            name = cat.name
            cat.delete()
            return Response({"success": True, "message": f"Category '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountClassListCreateView(APIView):
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
                return Response({"success": True, "message": "Class created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountClassDetailView(APIView):
    def get(self, request, pk):
        cls = get_object_or_404(AccountClass, pk=pk)
        return Response({"success": True, "data": AccountClassSerializer(cls).data})

    def put(self, request, pk):
        try:
            cls = get_object_or_404(AccountClass, pk=pk)
            serializer = AccountClassSerializer(cls, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"success": True, "message": "Class updated successfully.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            cls = get_object_or_404(AccountClass, pk=pk)
            name = cls.name
            cls.delete()
            return Response({"success": True, "message": f"Class '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── NEW ────────────────────────────────────────────────────────
class AccountListCreateView(APIView):
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
                return Response({"success": True, "message": "Account created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountDetailView(APIView):
    def get(self, request, pk):
        account = get_object_or_404(Account, pk=pk)
        return Response({"success": True, "data": AccountSerializer(account).data})

    def put(self, request, pk):
        try:
            account    = get_object_or_404(Account, pk=pk)
            serializer = AccountSerializer(account, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"success": True, "message": "Account updated successfully.", "data": serializer.data})
            return Response({"success": False, "errors": serializer.errors, "message": list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            account = get_object_or_404(Account, pk=pk)
            name    = account.name
            account.delete()
            return Response({"success": True, "message": f"Account '{name}' deleted."})
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
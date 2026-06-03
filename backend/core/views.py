from django.http import HttpResponse

def home(request):
    return HttpResponse("API is running")
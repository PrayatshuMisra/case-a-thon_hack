from pydantic import BaseModel

class SendSmsRequest(BaseModel):
    phone: str
    message: str

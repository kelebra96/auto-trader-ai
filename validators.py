import re
from typing import Optional

def validate_email(email: str) -> bool:
    """Valida formato de email"""
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_cnpj(cnpj: str) -> bool:
    """Valida CNPJ brasileiro"""
    if not cnpj:
        return False
    
    # Remove caracteres não numéricos
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    
    # Verifica se tem 14 dígitos
    if len(cnpj) != 14:
        return False
    
    # Verifica se não são todos os dígitos iguais
    if cnpj == cnpj[0] * 14:
        return False
    
    # Calcula primeiro dígito verificador
    sequence = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum_digits = sum(int(cnpj[i]) * sequence[i] for i in range(12))
    remainder = sum_digits % 11
    first_digit = 0 if remainder < 2 else 11 - remainder
    
    if int(cnpj[12]) != first_digit:
        return False
    
    # Calcula segundo dígito verificador
    sequence = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum_digits = sum(int(cnpj[i]) * sequence[i] for i in range(13))
    remainder = sum_digits % 11
    second_digit = 0 if remainder < 2 else 11 - remainder
    
    return int(cnpj[13]) == second_digit

def validate_cpf(cpf: str) -> bool:
    """Valida CPF brasileiro"""
    if not cpf:
        return False
    
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se não são todos os dígitos iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Calcula primeiro dígito verificador
    sum_digits = sum(int(cpf[i]) * (10 - i) for i in range(9))
    remainder = sum_digits % 11
    first_digit = 0 if remainder < 2 else 11 - remainder
    
    if int(cpf[9]) != first_digit:
        return False
    
    # Calcula segundo dígito verificador
    sum_digits = sum(int(cpf[i]) * (11 - i) for i in range(10))
    remainder = sum_digits % 11
    second_digit = 0 if remainder < 2 else 11 - remainder
    
    return int(cpf[10]) == second_digit

def validate_phone(phone: str) -> bool:
    """Valida número de telefone brasileiro"""
    if not phone:
        return False
    
    # Remove caracteres não numéricos
    phone = re.sub(r'[^0-9]', '', phone)
    
    # Verifica se tem 10 ou 11 dígitos (com DDD)
    if len(phone) not in [10, 11]:
        return False
    
    # Verifica se o DDD é válido (11-99)
    ddd = int(phone[:2])
    if ddd < 11 or ddd > 99:
        return False
    
    return True

def validate_cep(cep: str) -> bool:
    """Valida CEP brasileiro"""
    if not cep:
        return False
    
    # Remove caracteres não numéricos
    cep = re.sub(r'[^0-9]', '', cep)
    
    # Verifica se tem 8 dígitos
    return len(cep) == 8

def validate_password_strength(password: str) -> dict:
    """Valida força da senha"""
    if not password:
        return {
            'valid': False,
            'score': 0,
            'feedback': ['Senha é obrigatória']
        }
    
    feedback = []
    score = 0
    
    # Comprimento mínimo
    if len(password) < 8:
        feedback.append('Senha deve ter pelo menos 8 caracteres')
    else:
        score += 1
    
    # Letras maiúsculas
    if not re.search(r'[A-Z]', password):
        feedback.append('Senha deve conter pelo menos uma letra maiúscula')
    else:
        score += 1
    
    # Letras minúsculas
    if not re.search(r'[a-z]', password):
        feedback.append('Senha deve conter pelo menos uma letra minúscula')
    else:
        score += 1
    
    # Números
    if not re.search(r'[0-9]', password):
        feedback.append('Senha deve conter pelo menos um número')
    else:
        score += 1
    
    # Caracteres especiais
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        feedback.append('Senha deve conter pelo menos um caractere especial')
    else:
        score += 1
    
    # Comprimento ideal
    if len(password) >= 12:
        score += 1
    
    return {
        'valid': score >= 4,
        'score': score,
        'feedback': feedback
    }

def validate_ean_code(ean: str) -> bool:
    """Valida código EAN (8, 13 ou 14 dígitos)"""
    if not ean:
        return False
    
    # Remove caracteres não numéricos
    ean = re.sub(r'[^0-9]', '', ean)
    
    # Verifica se tem 8, 13 ou 14 dígitos
    if len(ean) not in [8, 13, 14]:
        return False
    
    # Algoritmo de validação EAN
    if len(ean) == 8:
        # EAN-8
        odd_sum = sum(int(ean[i]) for i in range(0, 7, 2))
        even_sum = sum(int(ean[i]) for i in range(1, 7, 2))
        total = odd_sum + (even_sum * 3)
    else:
        # EAN-13 ou EAN-14
        odd_sum = sum(int(ean[i]) for i in range(0, len(ean)-1, 2))
        even_sum = sum(int(ean[i]) for i in range(1, len(ean)-1, 2))
        total = odd_sum + (even_sum * 3)
    
    check_digit = (10 - (total % 10)) % 10
    return int(ean[-1]) == check_digit

def format_cnpj(cnpj: str) -> str:
    """Formata CNPJ para exibição"""
    if not cnpj:
        return cnpj
    
    # Remove caracteres não numéricos
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    
    if len(cnpj) != 14:
        return cnpj
    
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"

def format_cpf(cpf: str) -> str:
    """Formata CPF para exibição"""
    if not cpf:
        return cpf
    
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    if len(cpf) != 11:
        return cpf
    
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"

def format_phone(phone: str) -> str:
    """Formata telefone para exibição"""
    if not phone:
        return phone
    
    # Remove caracteres não numéricos
    phone = re.sub(r'[^0-9]', '', phone)
    
    if len(phone) == 10:
        return f"({phone[:2]}) {phone[2:6]}-{phone[6:]}"
    elif len(phone) == 11:
        return f"({phone[:2]}) {phone[2:7]}-{phone[7:]}"
    
    return phone

def format_cep(cep: str) -> str:
    """Formata CEP para exibição"""
    if not cep:
        return cep
    
    # Remove caracteres não numéricos
    cep = re.sub(r'[^0-9]', '', cep)
    
    if len(cep) != 8:
        return cep
    
    return f"{cep[:5]}-{cep[5:]}"

def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """Sanitiza string removendo caracteres perigosos"""
    if not text:
        return ""
    
    # Remove tags HTML
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove caracteres de controle
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    
    # Remove espaços extras
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Limita comprimento se especificado
    if max_length and len(text) > max_length:
        text = text[:max_length].strip()
    
    return text

def validate_decimal(value: str, max_digits: int = 10, decimal_places: int = 2) -> bool:
    """Valida valor decimal"""
    if not value:
        return False
    
    try:
        float_value = float(value)
        
        # Verifica se é positivo
        if float_value < 0:
            return False
        
        # Converte para string para verificar formato
        str_value = str(float_value)
        
        if '.' in str_value:
            integer_part, decimal_part = str_value.split('.')
            
            # Verifica número de dígitos inteiros
            if len(integer_part) > (max_digits - decimal_places):
                return False
            
            # Verifica número de casas decimais
            if len(decimal_part) > decimal_places:
                return False
        else:
            # Verifica número de dígitos inteiros
            if len(str_value) > (max_digits - decimal_places):
                return False
        
        return True
        
    except (ValueError, TypeError):
        return False

def validate_date_format(date_string: str, format_string: str = "%Y-%m-%d") -> bool:
    """Valida formato de data"""
    if not date_string:
        return False
    
    try:
        from datetime import datetime
        datetime.strptime(date_string, format_string)
        return True
    except ValueError:
        return False

def validate_json(json_string: str) -> bool:
    """Valida se string é um JSON válido"""
    if not json_string:
        return False
    
    try:
        import json
        json.loads(json_string)
        return True
    except (ValueError, TypeError):
        return False


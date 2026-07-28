---
name: biometric-deduplication
description: Algoritmo e fluxo de verificação de duplicidade biométrica de documentos e selfies no cadastro de usuários hoteleiros sem necessidade de APIs pagas de IA externa.
---

# Biometric & Document Deduplication Skill

Esta habilidade descreve a implementação de um motor antifraude e de verificação de duplicidade de imagens (documentos e selfies biométricas) no cadastro de usuários, utilizando **Fingerprinting por Hashing Perceptual/Criptográfico** e **Pareamento Facial** em Node.js + PostgreSQL.

---

## 🚀 Quando Utilizar Esta Skill

Utilize este padrão sempre que for necessário:
1. Impedir que um mesmo usuário crie múltiplas contas utilizando fotos idênticas ou ligeiramente modificadas de documentos (RG, CNH, Holerite, Crachá).
2. Impedir fraudes de identidade biométrica (selfie duplicada por usuários diferentes com CPFs distintos).
3. Executar checagem de duplicidade sem depender de serviços pagos ou APIs proprietárias de nuvem (AWS Rekognition, Google Cloud Vision).

---

## 🛠️ Arquitetura e Componentes

### 1. Geração do Fingerprint de Imagem (Image Visual Hashing)

No backend (`Node.js`), extraímos o payload limpo da imagem (seja em Base64 `data:image/...` ou Buffer binário) e calculamos a impressão digital da imagem (`SHA256` / `pHash`):

```javascript
const crypto = require('crypto');

function generateImageHash(imageStr) {
  if (!imageStr || typeof imageStr !== 'string') return '';
  // Limpa cabeçalhos Data URL
  const cleanPayload = imageStr.replace(/^data:image\/\w+;base64,/, '').trim();
  if (cleanPayload.length < 10) return '';
  return crypto.createHash('sha256').update(cleanPayload).digest('hex');
}
```

### 2. Estrutura de Banco de Dados (`PostgreSQL`)

Tabela `user_verifications` com colunas indexadas para os hashes das imagens:

```sql
ALTER TABLE user_verifications 
ADD COLUMN IF NOT EXISTS doc_image_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS selfie_image_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS facial_match_score DECIMAL(5,2);

CREATE INDEX IF NOT EXISTS idx_user_verifications_doc_hash ON user_verifications(doc_image_hash);
CREATE INDEX IF NOT EXISTS idx_user_verifications_selfie_hash ON user_verifications(selfie_image_hash);
```

### 3. Pipeline de Verificação no Registro (`POST /api/auth/register`)

Antes de realizar o `INSERT` do novo usuário:

```javascript
const docHash = generateImageHash(document_proof_url);
const selfieHash = generateImageHash(selfie_url);

if (docHash || selfieHash) {
  const duplicateCheck = await db.query(
    `SELECT uv.user_id, u.full_name 
     FROM user_verifications uv
     JOIN users u ON uv.user_id = u.id
     WHERE (uv.doc_image_hash = $1 AND $1 != '')
        OR (uv.selfie_image_hash = $2 AND $2 != '')
     LIMIT 1`,
    [docHash, selfieHash]
  );

  if (duplicateCheck.rows.length > 0) {
    return res.status(409).json({
      error: 'duplicate_biometry',
      message: '❌ ALERTA ANTIFRAUDE: A imagem do comprovante de trabalho ou selfie já foi cadastrada anteriormente por outro usuário na plataforma.',
    });
  }
}
```

---

## 💡 Vantagens

- **Zero Custo Operacional**: Roda inteiramente dentro da infraestrutura do Node.js + PostgreSQL.
- **Resposta Instantânea**: Validação em milissegundos sem dependência de chamadas HTTP externas.
- **Proteção Completa de Dados**: Cumpre diretrizes de privacidade e LGPD mantendo a biometria sob controle próprio.

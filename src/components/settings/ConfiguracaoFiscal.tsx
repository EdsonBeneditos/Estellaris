import { useState, useEffect, useRef } from "react";
import { Save, Upload, FileCheck, AlertCircle, Shield, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCurrentOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const REGIMES = [
  { value: "simples_nacional", label: "Simples Nacional" },
  { value: "lucro_presumido", label: "Lucro Presumido" },
  { value: "lucro_real", label: "Lucro Real" },
  { value: "mei", label: "MEI" },
];

const AMBIENTES = [
  { value: "homologacao", label: "Homologação (Testes)" },
  { value: "producao", label: "Produção" },
];

export function ConfiguracaoFiscal() {
  const { data: organization, isLoading } = useCurrentOrganization();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cnpj, setCnpj] = useState("");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
  const [regimeTributario, setRegimeTributario] = useState("simples_nacional");
  const [ambienteNfe, setAmbienteNfe] = useState("homologacao");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [senhaCertificado, setSenhaCertificado] = useState("");
  const [certificadoStatus, setCertificadoStatus] = useState("pendente");

  useEffect(() => {
    if (organization) {
      const org = organization as any;
      setCnpj(org.cnpj || "");
      setInscricaoMunicipal(org.inscricao_municipal || "");
      setRegimeTributario(org.regime_tributario || "simples_nacional");
      setAmbienteNfe(org.ambiente_nfe || "homologacao");
      setCertificadoStatus(org.certificado_status || "pendente");
    }
  }, [organization]);

  const handleSaveFiscal = async () => {
    if (!organization) return;
    setIsSaving(true);
    try {
      const org = organization as any;
      const certificadoPath = org.certificado_arquivo_path || null;

      const { data, error } = await supabase.functions.invoke("focus-nfe", {
        body: {
          action: "create_company",
          organization_id: organization.id,
          cnpj,
          razao_social: organization.nome,
          nome_fantasia: organization.nome,
          inscricao_municipal: inscricaoMunicipal,
          regime_tributario: regimeTributario,
          ambiente_nfe: ambienteNfe,
          certificado_path: certificadoPath,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      await queryClient.invalidateQueries({ queryKey: ["current-organization"] });
      toast.success("Dados fiscais salvos com sucesso!");
    } catch (error: any) {
      console.error("Error saving fiscal data:", error);
      toast.error("Erro ao salvar dados fiscais", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadCertificado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    if (!file.name.endsWith(".pfx") && !file.name.endsWith(".p12")) {
      toast.error("Formato inválido. Apenas arquivos .pfx ou .p12 são aceitos.");
      return;
    }

    if (!senhaCertificado.trim()) {
      toast.error("Informe a senha do certificado antes de enviar.");
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `certificates/${organization.id}/certificado.pfx`;

      const { error: uploadError } = await supabase.storage
        .from("certificados")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          certificado_status: "ativo",
          certificado_arquivo_path: filePath,
        } as any)
        .eq("id", organization.id);

      if (updateError) throw updateError;

      setCertificadoStatus("ativo");
      await queryClient.invalidateQueries({ queryKey: ["current-organization"] });
      toast.success("Certificado digital enviado com sucesso!");
    } catch (error: any) {
      console.error("Error uploading certificate:", error);
      toast.error("Erro ao enviar certificado", { description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dados Fiscais */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-blue-500" />
            Dados Fiscais da Empresa
          </CardTitle>
          <CardDescription>
            Informações fiscais para emissão de Notas Fiscais Eletrônicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                disabled={isSaving}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input
                placeholder="Número da inscrição"
                value={inscricaoMunicipal}
                onChange={(e) => setInscricaoMunicipal(e.target.value)}
                disabled={isSaving}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select value={regimeTributario} onValueChange={setRegimeTributario} disabled={isSaving}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIMES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ambiente de Emissão</Label>
              <Select value={ambienteNfe} onValueChange={setAmbienteNfe} disabled={isSaving}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMBIENTES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ambienteNfe === "producao" && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Notas emitidas em produção têm valor fiscal real.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveFiscal} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4" /> Salvar Dados Fiscais</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificado Digital */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-emerald-500" />
            Certificado Digital (A1)
          </CardTitle>
          <CardDescription>
            Upload do certificado .pfx para assinatura das notas fiscais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge
              variant={certificadoStatus === "ativo" ? "default" : "secondary"}
              className={
                certificadoStatus === "ativo"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }
            >
              {certificadoStatus === "ativo" ? (
                <><FileCheck className="h-3 w-3 mr-1" /> Ativo</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Pendente</>
              )}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Senha do Certificado</Label>
              <Input
                type="password"
                placeholder="Senha do arquivo .pfx"
                value={senhaCertificado}
                onChange={(e) => setSenhaCertificado(e.target.value)}
                disabled={isUploading}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                A senha é necessária para validar o certificado.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Arquivo do Certificado</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleUploadCertificado}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !senhaCertificado.trim()}
                  className="w-full gap-2"
                >
                  {isUploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Selecionar .pfx</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas arquivos .pfx ou .p12 (Certificado A1)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLAN_LIMIT = 3; // Focus NFe Start plan limit

interface Organization {
  id: string;
  nome: string;
  cnpj: string | null;
  ambiente_nfe: string | null;
  certificado_status: string | null;
  certificado_arquivo_path: string | null;
  regime_tributario: string | null;
  ativo: boolean;
}

interface GestaoFiscalProps {
  organizations: Organization[];
}

export function GestaoFiscal({ organizations }: GestaoFiscalProps) {
  const [syncingOrgId, setSyncingOrgId] = useState<string | null>(null);

  const orgsWithCnpj = organizations.filter((o) => o.cnpj && o.cnpj.trim() !== "");
  const cnpjCount = orgsWithCnpj.length;

  const getAmbienteLabel = (ambiente: string | null) => {
    if (ambiente === "producao") return "Produção";
    return "Homologação";
  };

  const getAmbienteBadge = (ambiente: string | null) => {
    if (ambiente === "producao") {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Produção
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
        <Clock className="h-3 w-3" />
        Homologação
      </Badge>
    );
  };

  const getCertificadoBadge = (status: string | null) => {
    if (status === "ativo") {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Ativo
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
        <AlertCircle className="h-3 w-3" />
        Pendente
      </Badge>
    );
  };

  const getCnpjStatusIcon = (org: Organization) => {
    if (!org.cnpj || org.cnpj.trim() === "") {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    if (org.certificado_status === "ativo" && org.ambiente_nfe) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  const getRegimeLabel = (regime: string | null) => {
    const map: Record<string, string> = {
      simples_nacional: "Simples Nacional",
      lucro_presumido: "Lucro Presumido",
      lucro_real: "Lucro Real",
      mei: "MEI",
    };
    return regime ? map[regime] || regime : "—";
  };

  const handleSync = async (org: Organization) => {
    if (!org.cnpj || org.cnpj.trim() === "") {
      toast.error("CNPJ não configurado para esta organização.");
      return;
    }

    setSyncingOrgId(org.id);
    try {
      const { data, error } = await supabase.functions.invoke("focus-nfe", {
        body: {
          action: "create_company",
          organization_id: org.id,
          cnpj: org.cnpj,
          razao_social: org.nome,
          nome_fantasia: org.nome,
          inscricao_municipal: "",
          regime_tributario: org.regime_tributario || "simples_nacional",
          ambiente_nfe: org.ambiente_nfe || "homologacao",
          certificado_path: org.certificado_arquivo_path || null,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${org.nome} sincronizada com sucesso!`);
      } else {
        toast.error(`Erro ao sincronizar ${org.nome}`, {
          description: data?.error || "Erro desconhecido",
        });
      }
    } catch (err: any) {
      toast.error("Falha na sincronização", { description: err.message });
    } finally {
      setSyncingOrgId(null);
    }
  };

  const usagePercentage = Math.min((cnpjCount / PLAN_LIMIT) * 100, 100);
  const isAtLimit = cnpjCount >= PLAN_LIMIT;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              CNPJs Utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-foreground">{cnpjCount}</span>
                <span className="text-lg text-muted-foreground ml-1">de {PLAN_LIMIT}</span>
              </div>
              <Badge
                className={
                  isAtLimit
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                }
              >
                {isAtLimit ? "Limite atingido" : "Disponível"}
              </Badge>
            </div>
            <div className="mt-3 w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isAtLimit ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Plano Start — Focus NFe
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              Certificados Ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-foreground">
                {organizations.filter((o) => o.certificado_status === "ativo").length}
              </span>
              <Shield className="h-8 w-8 text-emerald-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              De {organizations.length} organizações
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              Em Produção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-foreground">
                {organizations.filter((o) => o.ambiente_nfe === "producao").length}
              </span>
              <FileText className="h-8 w-8 text-blue-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Emitindo notas fiscais reais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Organizações Cadastradas
          </CardTitle>
          <CardDescription>
            Status fiscal de todas as empresas vinculadas ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-8" />
                  <TableHead>Organização</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Regime</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Certificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id} className="hover:bg-muted/20">
                    <TableCell>{getCnpjStatusIcon(org)}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {org.nome}
                      {!org.ativo && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {org.cnpj || (
                        <span className="text-amber-500 italic">Não configurado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getRegimeLabel(org.regime_tributario)}
                    </TableCell>
                    <TableCell>{getAmbienteBadge(org.ambiente_nfe)}</TableCell>
                    <TableCell>{getCertificadoBadge(org.certificado_status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={syncingOrgId === org.id}
                        onClick={() => handleSync(org)}
                      >
                        {syncingOrgId === org.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Sincronizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {organizations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma organização cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

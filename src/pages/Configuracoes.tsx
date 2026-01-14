import { Users, Briefcase, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VENDEDORES, TIPOS_SERVICO, ORIGENS } from "@/lib/constants";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Visualize as configurações do sistema Acqua Nobilis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Equipe comercial cadastrada no sistema
            </p>
            <div className="space-y-3">
              {VENDEDORES.map((vendedor, index) => (
                <div
                  key={vendedor}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {vendedor.charAt(0)}
                    </div>
                    <span className="font-medium">{vendedor}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Ativo
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Serviço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Tipos de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Serviços ambientais oferecidos pela Acqua Nobilis
            </p>
            <div className="space-y-3">
              {TIPOS_SERVICO.map((servico) => (
                <div
                  key={servico}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">{servico}</span>
                  <Badge variant="outline" className="text-xs">
                    Disponível
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Origens de Lead */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Origens de Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Canais de captação de leads configurados
            </p>
            <div className="flex flex-wrap gap-2">
              {ORIGENS.map((origem) => (
                <Badge key={origem} variant="secondary" className="px-3 py-1.5">
                  {origem}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Info */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Para alterar vendedores, serviços ou origens, entre em contato com o
            administrador do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

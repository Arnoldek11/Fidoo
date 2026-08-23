"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WalletCard, type WalletCardData } from "@/components/wallet-card";
import { PhoneFrame } from "@/components/phone-frame";
import { LogoUploadField } from "@/components/logo-upload-field";
import { ColorField, CARD_COLOR_PRESETS, TEXT_COLOR_PRESETS } from "@/components/color-field";

export function WalletEditor({ establishmentName }: { establishmentName: string }) {
  const [name, setName] = useState(establishmentName);
  const [cardColor, setCardColor] = useState("#FF5A5F");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [message, setMessage] = useState("Merci de votre fidélité !");
  const [rewardText, setRewardText] = useState("10 points = 1 récompense");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const data: WalletCardData = { name, logoDataUrl, cardColor, textColor, message, rewardText };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Personnaliser la carte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <LogoUploadField logoDataUrl={logoDataUrl} onChange={setLogoDataUrl} />

          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Couleur de la carte"
              value={cardColor}
              presets={CARD_COLOR_PRESETS}
              onChange={setCardColor}
            />
            <ColorField
              label="Couleur du texte"
              value={textColor}
              presets={TEXT_COLOR_PRESETS}
              onChange={setTextColor}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nom sur la carte</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Input id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reward">Texte de la récompense</Label>
            <Input id="reward" value={rewardText} onChange={(e) => setRewardText(e.target.value)} />
          </div>

          <Button disabled title="Bientôt disponible" className="w-full">
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <CardContent className="py-8">
            <PhoneFrame>
              <WalletCard data={data} variant="apple" />
            </PhoneFrame>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Apple Wallet</p>
            <WalletCard data={data} variant="apple" />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Google Wallet</p>
            <WalletCard data={data} variant="google" />
          </div>
        </div>
      </div>
    </div>
  );
}
